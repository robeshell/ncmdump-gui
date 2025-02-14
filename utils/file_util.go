package utils

import (
	"os"
	"path/filepath"
)

func ListFilesFromFolder(root string, ext string) ([]string, error) {
	var files []string

	// Walk函数会遍历文件树，递归地访问每个目录和文件
	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// 检查是否是文件以及文件后缀是否匹配
		if !info.IsDir() && filepath.Ext(path) == "."+ext {
			files = append(files, path)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return files, nil
}
