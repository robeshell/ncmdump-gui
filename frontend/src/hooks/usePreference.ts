import { useCallback, useEffect, useState } from 'react'
import { Load, Save } from '../../wailsjs/go/utils/ConfigManager'
import type { Preference, SaveTo } from '../types'

const defaults: Preference = {
  save_to: 'original',
  path: '',
  fetch_cover: true,
  embed_lyrics: true,
}

export function usePreference() {
  const [saveTo, setSaveTo] = useState<SaveTo>('original')
  const [savePath, setSavePath] = useState('')
  const [fetchCover, setFetchCover] = useState(true)
  const [embedLyrics, setEmbedLyrics] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Load()
      .then(res => {
        if (!res) return
        setSaveTo((res.save_to as SaveTo) || 'original')
        setSavePath(res.path || '')
        setFetchCover(res.fetch_cover !== false)
        setEmbedLyrics(res.embed_lyrics !== false)
      })
      .catch(() => {})
      .finally(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready) return
    const pref: Preference = {
      save_to: saveTo,
      path: savePath,
      fetch_cover: fetchCover,
      embed_lyrics: embedLyrics,
    }
    Save(pref).catch(() => {})
  }, [ready, saveTo, savePath, fetchCover, embedLyrics])

  const setOriginal = useCallback(() => {
    setSaveTo('original')
    setSavePath('')
  }, [])

  return {
    saveTo,
    setSaveTo,
    savePath,
    setSavePath,
    fetchCover,
    setFetchCover,
    embedLyrics,
    setEmbedLyrics,
    setOriginal,
    ready,
    defaults,
  }
}
