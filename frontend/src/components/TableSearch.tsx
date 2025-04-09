import { useRef, useState } from 'react';
import { Input, Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import type { ColumnType } from 'antd/es/table';
import type { FilterConfirmProps } from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';

/**
 * 表格搜索组件属性
 */
interface TableSearchProps<T> {
  /**
   * 要搜索的数据字段
   */
  dataIndex: keyof T;
  /**
   * 搜索框占位符
   */
  placeholder?: string;
  /**
   * 自定义搜索逻辑
   */
  customFilter?: (value: string, record: T) => boolean;
  /**
   * 自定义渲染逻辑
   */
  customRender?: (text: any, record: T) => React.ReactNode;
}

/**
 * 表格搜索组件
 * 用于在表格列中添加搜索功能
 */
export function useTableSearch<T extends Record<string, any>>() {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);

  /**
   * 处理搜索
   */
  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: keyof T,
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex as string);
  };

  /**
   * 处理重置
   */
  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  /**
   * 获取列搜索属性
   */
  const getColumnSearchProps = ({
    dataIndex,
    placeholder,
    customFilter,
    customRender
  }: TableSearchProps<T>): ColumnType<T> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={placeholder || `搜索 ${String(dataIndex)}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            重置
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            关闭
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) => {
      if (customFilter) {
        return customFilter(value as string, record);
      }
      
      return (record[dataIndex] as string)
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase());
    },
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      }
    },
    render: (text, record) => {
      if (customRender) {
        return customRender(text, record);
      }
      
      return searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      );
    },
  });

  return {
    searchText,
    searchedColumn,
    getColumnSearchProps
  };
} 