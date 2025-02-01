import React, { useEffect } from 'react'
import { useState } from 'react'
import {
  Button,
  createTableColumn,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Radio,
  RadioGroup,
  TableColumnDefinition,
  TableColumnSizingOptions,
  useTableColumnSizing_unstable,
  useTableFeatures,
} from '@fluentui/react-components'
import {
  TableBody,
  TableCell,
  TableRow,
  Table,
  TableHeader,
  TableHeaderCell,
  TableCellLayout,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  ClockRegular,
  CheckmarkRegular,
  DismissRegular,
  DocumentArrowRightRegular,
} from '@fluentui/react-icons'

import { Status, Item, SaveTo } from './types'
import { SelectFiles, SelectFolder, ProcessFiles } from '../wailsjs/go/main/App'
import { main } from '../wailsjs/go/models'
import { EventsOn, OnFileDrop } from '../wailsjs/runtime/runtime'

const columnsDef: TableColumnDefinition<Item>[] = [
  createTableColumn<Item>({
    columnId: 'status',
    renderHeaderCell: () => <>状态</>,
  }),
  createTableColumn<Item>({
    columnId: 'file',
    renderHeaderCell: () => <>文件</>,
  }),
]

const useStyles = makeStyles({
  iconGreen: {
    color: tokens.colorPaletteGreenForeground1,
  },
  iconRed: {
    color: tokens.colorPaletteRedForeground1,
  },
  iconYellow: {
    color: tokens.colorPaletteYellowForeground1,
  },
})

export const App = () => {
  const styles = useStyles()

  const [items, setItems] = useState<Item[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const [totalFilesNeedToProcess, setTotalFilesNeedToProcess] = useState(0)
  const [finishedCount, setFinishedCount] = useState(0)

  const [saveTo, setSaveTo] = useState<SaveTo>('original')
  const [savePath, setSavePath] = useState('')

  const [message, setMessage] = useState('')
  const [open, setOpen] = useState(false)

  const [columns] = React.useState<TableColumnDefinition<Item>[]>(columnsDef)
  const [columnSizingOptions] = React.useState<TableColumnSizingOptions>({
    status: {
      idealWidth: 100,
      minWidth: 100,
    },
    file: {
      idealWidth: 150,
      minWidth: 150,
    },
  })

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { getRows, columnSizing_unstable, tableRef } = useTableFeatures(
    {
      columns,
      items,
    },
    [useTableColumnSizing_unstable({ columnSizingOptions })]
  )

  // return the icon based on the status
  const statusMapIcon = (status: Status) => {
    switch (status) {
      case 'pending':
        return <ClockRegular />
      case 'processing':
        return <DocumentArrowRightRegular className={styles.iconYellow} />
      case 'done':
        return <CheckmarkRegular className={styles.iconGreen} />
      case 'error':
        return <DismissRegular className={styles.iconRed} />
      default:
    }
  }

  // return the text based on the status
  const statusMapText = (status: Status) => {
    switch (status) {
      case 'pending':
        return '等待'
      case 'processing':
        return '处理'
      case 'done':
        return '完成'
      case 'error':
        return '错误'
    }
  }

  const selectFiles = () => {
    SelectFiles().then(files => {
      for (const file of files) {
        setItems(prev => [...prev, { file, status: 'pending' }])
      }
      setTotalFilesNeedToProcess(prev => prev + files.length)
    })
  }

  const showDialog = (message: string) => {
    setMessage(message)
    setOpen(true)
  }

  const startProcess = async () => {
    // 未添加文件时
    if (items.length === 0) {
      showDialog('当前文件列表为空，请先添加文件。')
      return
    }
    // 检查所有文件是否都已处理完毕
    let isAllFinished = true
    for (const item of items) {
      if (item.status === 'pending') {
        isAllFinished = false
        break
      }
    }
    if (isAllFinished) {
      showDialog('当前文件列表已全部处理完毕，请重新添加新的文件。')
      return
    }
    setIsProcessing(true)
    const ncmFiles: main.NcmFile[] = []
    items.forEach(item => {
      ncmFiles.push({
        Name: item.file,
        Status: item.status,
      })
    })
    ProcessFiles(ncmFiles, savePath).then(() => {})
  }

  useEffect(() => {
    EventsOn('file-status-changed', (index: number, status: Status) => {
      if (status == 'done' || status === 'error') {
        setFinishedCount(prev => prev + 1)
      }
      setItems(prev => {
        const newItems = [...prev]
        newItems[index].status = status
        return newItems
      })
    })
  }, [])

  useEffect(() => {
    if (finishedCount === totalFilesNeedToProcess) {
      setFinishedCount(0)
      setTotalFilesNeedToProcess(0)
      setIsProcessing(false)
    }
  }, [finishedCount])

  OnFileDrop((_x, _y, paths) => {
    for (const path of paths) {
      setItems(prev => [...prev, { file: path, status: 'pending' }])
    }
    console.log(paths.length, paths)
    setTotalFilesNeedToProcess(prev => prev + paths.length)
  }, false)

  return (
    <div className="p-3">
      <Dialog
        // this controls the dialog open state
        open={open}
        onOpenChange={(event, data) => {
          // it is the users responsibility to react accordingly to the open state change
          setOpen(data.open)
        }}
      >
        <DialogSurface style={{ width: '400px' }}>
          <DialogBody>
            <DialogTitle>警告</DialogTitle>
            <DialogContent>{message}</DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="primary">关闭</Button>
              </DialogTrigger>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <div className="flex space-between gap-3">
        <Button onClick={selectFiles}>添加文件</Button>
        <Button onClick={() => setItems([])}>清除列表</Button>
        <Button
          appearance="primary"
          onClick={() => {
            startProcess()
          }}
          disabled={isProcessing}
        >
          {isProcessing ? '处理中...' : '开始处理'}
        </Button>
      </div>
      <div className="mt-3">
        <Field label="保存转换后的文件到">
          <RadioGroup
            layout="horizontal"
            value={saveTo}
            onChange={(_, data) => {
              setSaveTo(data.value as SaveTo)
              if (data.value === 'original') {
                setSavePath('')
              }
            }}
          >
            <Radio value="original" label="源文件所在目录" />
            <Radio value="custom" label="自定义保存目录" />
            {saveTo === 'custom' && (
              <Input
                placeholder="点击来选择保存目录"
                value={savePath}
                readOnly
                style={{ flexGrow: 1 }}
                onClick={() => {
                  SelectFolder().then(path => {
                    if (path) {
                      setSavePath(path)
                    }
                  })
                }}
              />
            )}
          </RadioGroup>
        </Field>
      </div>
      <Table
        ref={tableRef}
        arial-label="Default table"
        style={{ minWidth: '510px' }}
        size="small"
        className="mt-3"
      >
        <TableHeader>
          <TableRow>
            {columns.map(column => (
              <TableHeaderCell
                key={column.columnId}
                {...columnSizing_unstable.getTableHeaderCellProps(column.columnId)}
              >
                {column.renderHeaderCell()}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((file, index) => (
            <TableRow key={index}>
              <TableCell>
                <TableCellLayout media={statusMapIcon(file.status)}>
                  {statusMapText(file.status)}
                </TableCellLayout>
              </TableCell>
              <TableCell>{file.file}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default App
