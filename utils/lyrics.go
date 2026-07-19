package utils

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/bogem/id3v2/v2"
	"github.com/go-flac/flacvorbis"
	"github.com/go-flac/go-flac"
)

// FindSiblingLyrics looks for a lyrics file next to the given media/ncm path.
// Candidates (same directory), in order:
//
//	basename.lrc, basename.LRC, basename.ncm.lrc, basename.txt, basename.TXT
func FindSiblingLyrics(mediaPath string) string {
	dir := filepath.Dir(mediaPath)
	base := filepath.Base(mediaPath)
	ext := filepath.Ext(base)
	name := strings.TrimSuffix(base, ext) // e.g. song from song.ncm

	candidates := []string{
		filepath.Join(dir, name+".lrc"),
		filepath.Join(dir, name+".LRC"),
		filepath.Join(dir, base+".lrc"), // song.ncm.lrc
		filepath.Join(dir, base+".LRC"),
		filepath.Join(dir, name+".txt"),
		filepath.Join(dir, name+".TXT"),
	}

	for _, p := range candidates {
		if st, err := os.Stat(p); err == nil && !st.IsDir() && st.Size() > 0 {
			return p
		}
	}
	return ""
}

// ReadLyricsFile loads lyrics text; empty file returns error.
func ReadLyricsFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	text := strings.TrimSpace(string(data))
	// strip UTF-8 BOM
	text = strings.TrimPrefix(text, "\uFEFF")
	if text == "" {
		return "", fmt.Errorf("歌词文件为空")
	}
	return text, nil
}

// EmbedLyrics writes lyrics into an MP3 (USLT) or FLAC (LYRICS) file.
func EmbedLyrics(audioPath, lyrics string) error {
	if strings.TrimSpace(lyrics) == "" {
		return fmt.Errorf("歌词内容为空")
	}
	ext := strings.ToLower(filepath.Ext(audioPath))
	switch ext {
	case ".mp3":
		return embedLyricsMP3(audioPath, lyrics)
	case ".flac":
		return embedLyricsFLAC(audioPath, lyrics)
	default:
		return fmt.Errorf("不支持的格式: %s", ext)
	}
}

func embedLyricsMP3(path, lyrics string) error {
	tag, err := id3v2.Open(path, id3v2.Options{Parse: true})
	if err != nil {
		return err
	}
	defer tag.Close()

	tag.SetDefaultEncoding(id3v2.EncodingUTF8)
	// Replace existing USLT frames by clearing the ID then adding one.
	tag.DeleteFrames(tag.CommonID("Unsynchronised lyrics/text transcription"))
	tag.AddUnsynchronisedLyricsFrame(id3v2.UnsynchronisedLyricsFrame{
		Encoding:          id3v2.EncodingUTF8,
		Language:          "chi",
		ContentDescriptor: "",
		Lyrics:            lyrics,
	})
	return tag.Save()
}

func embedLyricsFLAC(path, lyrics string) error {
	f, err := flac.ParseFile(path)
	if err != nil {
		return err
	}

	var cmts *flacvorbis.MetaDataBlockVorbisComment
	var cmtIdx = -1
	for idx, meta := range f.Meta {
		if meta.Type == flac.VorbisComment {
			cmts, err = flacvorbis.ParseFromMetaDataBlock(*meta)
			if err != nil {
				return err
			}
			cmtIdx = idx
			break
		}
	}
	if cmts == nil {
		cmts = flacvorbis.New()
	}

	// Keep full LRC (with timestamps) in LYRICS — widely used by players.
	// Also set UNSYNCEDLYRICS for broader plain-text support.
	replaceVorbisField(cmts, "LYRICS", lyrics)
	replaceVorbisField(cmts, "UNSYNCEDLYRICS", stripLrcTimestamps(lyrics))

	block := cmts.Marshal()
	if cmtIdx >= 0 {
		f.Meta[cmtIdx] = &block
	} else {
		f.Meta = append(f.Meta, &block)
	}
	return f.Save(path)
}

func replaceVorbisField(cmts *flacvorbis.MetaDataBlockVorbisComment, key, value string) {
	filtered := make([]string, 0, len(cmts.Comments)+1)
	for _, cmt := range cmts.Comments {
		p := strings.SplitN(cmt, "=", 2)
		if len(p) == 2 && strings.EqualFold(p[0], key) {
			continue
		}
		filtered = append(filtered, cmt)
	}
	cmts.Comments = append(filtered, key+"="+value)
}

// stripLrcTimestamps removes [mm:ss.xx] style tags for a plain-text fallback.
func stripLrcTimestamps(s string) string {
	lines := strings.Split(s, "\n")
	out := make([]string, 0, len(lines))
	for _, line := range lines {
		line = strings.TrimSpace(line)
		for {
			// strip leading [tag] segments
			if !strings.HasPrefix(line, "[") {
				break
			}
			end := strings.Index(line, "]")
			if end < 0 {
				break
			}
			line = strings.TrimSpace(line[end+1:])
		}
		// skip pure metadata tags already stripped to empty (ti/ar/al/by/offset)
		if line == "" {
			continue
		}
		out = append(out, line)
	}
	return strings.Join(out, "\n")
}
