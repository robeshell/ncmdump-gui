import { useState } from 'react'
import { Button } from '@fluentui/react-components'
import {
  TableBody,
  TableCell,
  TableRow,
  Table,
  TableHeader,
  TableHeaderCell,
  TableCellLayout,
  PresenceBadgeStatus,
  Avatar,
} from '@fluentui/react-components'

export const App = () => {
  return (
    <div className='p-2'>
      <div className="flex space-between gap-2">
        <Button>添加文件</Button>
        <Button>清除列表</Button>
        <Button appearance="primary">开始转换</Button>
      </div>
    </div>
  )
}

export default App
