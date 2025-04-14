import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import CodeBlock from '@tiptap/extension-code-block';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Typography from '@tiptap/extension-typography';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import { Button, Tooltip, Space, Divider, Dropdown, Select, ColorPicker, Popover, message, Input } from 'antd';
import { 
  BoldOutlined, 
  ItalicOutlined, 
  UnderlineOutlined, 
  StrikethroughOutlined, 
  OrderedListOutlined, 
  UnorderedListOutlined, 
  AlignLeftOutlined, 
  AlignCenterOutlined, 
  AlignRightOutlined, 
  LinkOutlined, 
  PictureOutlined, 
  RedoOutlined, 
  UndoOutlined, 
  BlockOutlined,
  CodeOutlined,
  TableOutlined,
  HighlightOutlined,
  BgColorsOutlined,
  FontColorsOutlined,
  ClearOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  MenuOutlined
} from '@ant-design/icons';
import './TiptapEditor.css';
import { uploadImage } from '../api/vote';
import { debounce } from 'lodash';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

// 标题选项
const headingOptions = [
  { label: '正文', value: 'paragraph' },
  { label: '标题1', value: 'h1' },
  { label: '标题2', value: 'h2' },
  { label: '标题3', value: 'h3' },
  { label: '标题4', value: 'h4' },
  { label: '标题5', value: 'h5' },
  { label: '标题6', value: 'h6' },
];

// 字体选项
const fontOptions = [
  { label: '默认字体', value: '' },
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '宋体', value: 'SimSun' },
  { label: '黑体', value: 'SimHei' },
  { label: '楷体', value: 'KaiTi' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Verdana', value: 'Verdana' },
];

// 字号选项
const fontSizeOptions = [
  { label: '默认', value: '' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '28px', value: '28px' },
  { label: '32px', value: '32px' },
  { label: '36px', value: '36px' },
  { label: '42px', value: '42px' },
];

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  placeholder = '请输入内容...',
  readOnly = false,
  style,
  className
}) => {
  const [textColor, setTextColor] = useState<string>('#000000');
  const [highlightColor, setHighlightColor] = useState<string>('#FFFF00');

  // 初始化编辑器
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
      }),
      Image.configure({
        allowBase64: true,
        inline: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
      Underline,
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'tiptap-code-block',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Superscript,
      Subscript,
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      Typography,
      FontFamily.configure(),
      FontSize.configure(),
    ],
    content: content || '',
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
        placeholder: placeholder,
      },
    },
  });

  // 当内容从外部更改时更新编辑器内容
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  // 工具栏按钮
  const ToolbarButton = ({ 
    onClick, 
    active = false, 
    icon, 
    title 
  }: { 
    onClick: () => void, 
    active?: boolean, 
    icon: React.ReactNode, 
    title: string 
  }) => (
    <Tooltip title={title}>
      <Button
        type={active ? 'primary' : 'default'}
        icon={icon}
        onClick={onClick}
        size="small"
      />
    </Tooltip>
  );

  // 插入表格的弹出框内容
  const TableInsertPopover = () => (
    <div style={{ padding: '8px' }}>
      <Space direction="vertical">
        <div>插入表格:</div>
        <Space>
          <Input
            type="number"
            min={1}
            max={10}
            style={{ width: 60 }}
            placeholder="行"
            id="customRows"
            defaultValue={3}
          />
          <Input
            type="number"
            min={1}
            max={10}
            style={{ width: 60 }}
            placeholder="列"
            id="customCols"
            defaultValue={3}
          />
          <Button onClick={() => {
            const rowsElement = document.getElementById('customRows') as HTMLInputElement;
            const colsElement = document.getElementById('customCols') as HTMLInputElement;
            const rows = parseInt(rowsElement?.value || '3', 10);
            const cols = parseInt(colsElement?.value || '3', 10);
            insertTable(rows, cols);
          }}>插入</Button>
        </Space>
      </Space>
    </div>
  );

  // 插入表格
  const insertTable = (rows: number, cols: number) => {
    editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  };

  // 设置标题或段落
  const handleHeadingChange = (value: string) => {
    if (value === 'paragraph') {
      editor?.chain().focus().setParagraph().run();
    } else {
      editor?.chain().focus().toggleHeading({ level: parseInt(value.charAt(1)) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
    }
  };

  // 清除格式
  const clearFormatting = () => {
    editor?.chain().focus().clearNodes().unsetAllMarks().run();
  };

  // 处理文本颜色变更
  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    editor?.chain().focus().setColor(color).run();
  };

  // 处理高亮颜色变更
  const handleHighlightChange = (color: string) => {
    setHighlightColor(color);
    editor?.chain().focus().toggleHighlight({ color }).run();
  };

  if (!editor) {
    return null;
  }

  // 获取当前激活的标题
  const getActiveHeading = () => {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('heading', { level: 4 })) return 'h4';
    if (editor.isActive('heading', { level: 5 })) return 'h5';
    if (editor.isActive('heading', { level: 6 })) return 'h6';
    return 'paragraph';
  };

  // 获取当前激活的字体
  const getActiveFont = () => {
    if (!editor) return '';
    
    const font = editor.getAttributes('textStyle').fontFamily;
    return font || '';
  };

  // 获取当前激活的字号
  const getActiveFontSize = () => {
    if (!editor) return '';
    
    const fontSize = editor.getAttributes('textStyle').fontSize;
    return fontSize || '';
  };

  return (
    <div className={`tiptap-editor-container ${className || ''}`} style={style}>
      {!readOnly && (
        <div className="tiptap-toolbar">
          <Space size="small" wrap>
            {/* 标题选择 */}
            <Select
              value={getActiveHeading()}
              onChange={handleHeadingChange}
              style={{ width: 100 }}
              size="small"
              options={headingOptions}
            />
            
            {/* 字体选择 */}
            <Select
              value={getActiveFont()}
              onChange={(value) => editor.chain().focus().setFontFamily(value).run()}
              style={{ width: 120 }}
              size="small"
              options={fontOptions}
              placeholder="字体"
            />
            
            {/* 字号选择 */}
            <Select
              value={getActiveFontSize()}
              onChange={(value) => editor.chain().focus().setFontSize(value).run()}
              style={{ width: 80 }}
              size="small"
              options={fontSizeOptions}
              placeholder="字号"
            />

            <Divider type="vertical" />

            {/* 文本格式 */}
            <ToolbarButton
              title="加粗"
              icon={<BoldOutlined />}
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
            />
            <ToolbarButton
              title="斜体"
              icon={<ItalicOutlined />}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
            />
            <ToolbarButton
              title="下划线"
              icon={<UnderlineOutlined />}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
            />
            <ToolbarButton
              title="删除线"
              icon={<StrikethroughOutlined />}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
            />

            <Divider type="vertical" />

            {/* 字体颜色和背景色 */}
            <Tooltip title="文字颜色">
              <ColorPicker
                value={textColor}
                onChange={(color) => handleTextColorChange(color.toHexString())}
                size="small"
              >
                <Button 
                  size="small" 
                  icon={<FontColorsOutlined style={{ color: textColor !== '#000000' ? textColor : undefined }} />} 
                  type={editor.isActive('textStyle') ? 'primary' : 'default'}
                />
              </ColorPicker>
            </Tooltip>
            
            <Tooltip title="高亮颜色">
              <ColorPicker
                value={highlightColor}
                onChange={(color) => handleHighlightChange(color.toHexString())}
                size="small"
              >
                <Button 
                  size="small" 
                  icon={<BgColorsOutlined style={{ color: highlightColor !== '#FFFF00' ? highlightColor : undefined }} />}
                  type={editor.isActive('highlight') ? 'primary' : 'default'}
                />
              </ColorPicker>
            </Tooltip>
            
            <Divider type="vertical" />

            {/* 上标和下标 */}
            <ToolbarButton
              title="上标"
              icon={<VerticalAlignTopOutlined />}
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
              active={editor.isActive('superscript')}
            />
            <ToolbarButton
              title="下标"
              icon={<VerticalAlignBottomOutlined />}
              onClick={() => editor.chain().focus().toggleSubscript().run()}
              active={editor.isActive('subscript')}
            />

            <Divider type="vertical" />

            {/* 列表 */}
            <ToolbarButton
              title="无序列表"
              icon={<UnorderedListOutlined />}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
            />
            <ToolbarButton
              title="有序列表"
              icon={<OrderedListOutlined />}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
            />
            
            <Divider type="vertical" />
            
            {/* 对齐方式 */}
            <ToolbarButton
              title="左对齐"
              icon={<AlignLeftOutlined />}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              active={editor.isActive({ textAlign: 'left' })}
            />
            <ToolbarButton
              title="居中"
              icon={<AlignCenterOutlined />}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              active={editor.isActive({ textAlign: 'center' })}
            />
            <ToolbarButton
              title="右对齐"
              icon={<AlignRightOutlined />}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              active={editor.isActive({ textAlign: 'right' })}
            />
            
            <Divider type="vertical" />
            
            {/* 代码块和引用 */}
            <ToolbarButton
              title="代码块"
              icon={<CodeOutlined />}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              active={editor.isActive('codeBlock')}
            />
            <ToolbarButton
              title="引用"
              icon={<BlockOutlined />}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive('blockquote')}
            />
            
            <Divider type="vertical" />
            
            {/* 插入功能 */}
            <ToolbarButton
              title="插入链接"
              icon={<LinkOutlined />}
              onClick={() => {
                const url = window.prompt('请输入链接URL');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              active={editor.isActive('link')}
            />
            
            <ToolbarButton
              title="插入图片"
              icon={<PictureOutlined />}
              onClick={() => {
                // 创建隐藏的文件输入框
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                
                // 处理文件选择
                input.onchange = async (event) => {
                  const file = (event.target as HTMLInputElement).files?.[0];
                  if (file) {
                    try {
                      // 显示上传中状态
                      message.loading('图片上传中...');
                      
                      // 调用已有的上传API
                      const imageUrl = await uploadImage(file);
                      
                      // 插入图片到编辑器
                      editor.chain().focus().setImage({ src: imageUrl }).run();
                      
                      message.success('图片上传成功');
                    } catch (error) {
                      message.error('图片上传失败');
                      console.error(error);
                    }
                  }
                };
                
                // 触发文件选择
                input.click();
              }}
              active={false}
            />
            
            <Popover 
              content={<TableInsertPopover />} 
              title="插入表格" 
              trigger="click" 
              placement="bottom"
            >
              <Button 
                icon={<TableOutlined />} 
                size="small" 
                type={editor.isActive('table') ? 'primary' : 'default'}
              />
            </Popover>
            
            <Divider type="vertical" />
            
            {/* 撤销重做和清除格式 */}
            <ToolbarButton
              title="撤销"
              icon={<UndoOutlined />}
              onClick={() => editor.chain().focus().undo().run()}
              active={false}
            />
            <ToolbarButton
              title="重做"
              icon={<RedoOutlined />}
              onClick={() => editor.chain().focus().redo().run()}
              active={false}
            />
            <ToolbarButton
              title="清除格式"
              icon={<ClearOutlined />}
              onClick={clearFormatting}
              active={false}
            />
          </Space>
        </div>
      )}
      <EditorContent className="tiptap-editor" editor={editor} />
    </div>
  );
};

export default TiptapEditor; 