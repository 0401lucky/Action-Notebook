# Requirements Document

## Introduction

本功能为日记编辑器添加富文本编辑能力，使用 Tiptap 编辑器框架实现。用户可以在日记中使用加粗、斜体、删除线、列表、引用块和代码块等格式化功能，提升日记的表达能力和可读性。

## Glossary

- **RichTextEditor（富文本编辑器）**: 基于 Tiptap 的可视化文本编辑组件，支持格式化操作
- **Toolbar（工具栏）**: 编辑器顶部的格式化按钮区域
- **HTML Content（HTML 内容）**: 富文本编辑器输出的 HTML 格式字符串
- **Plain Text（纯文本）**: 不含格式标记的普通文本
- **Tiptap**: 基于 ProseMirror 的 Vue 友好型富文本编辑器框架
- **JournalEntry（日记条目）**: 单条日记记录，包含内容、心情和时间戳

## Requirements

### Requirement 1

**User Story:** As a user, I want to format my journal text with bold, italic, and strikethrough, so that I can emphasize important content.

#### Acceptance Criteria

1. WHEN a user selects text and clicks the bold button THEN the RichTextEditor SHALL apply bold formatting to the selected text
2. WHEN a user selects text and clicks the italic button THEN the RichTextEditor SHALL apply italic formatting to the selected text
3. WHEN a user selects text and clicks the strikethrough button THEN the RichTextEditor SHALL apply strikethrough formatting to the selected text
4. WHEN a user presses Ctrl+B (or Cmd+B on Mac) THEN the RichTextEditor SHALL toggle bold formatting on the selected text
5. WHEN a user presses Ctrl+I (or Cmd+I on Mac) THEN the RichTextEditor SHALL toggle italic formatting on the selected text

### Requirement 2

**User Story:** As a user, I want to create lists in my journal, so that I can organize my thoughts in a structured way.

#### Acceptance Criteria

1. WHEN a user clicks the bullet list button THEN the RichTextEditor SHALL convert the current line to an unordered list item
2. WHEN a user clicks the numbered list button THEN the RichTextEditor SHALL convert the current line to an ordered list item
3. WHEN a user presses Enter at the end of a list item THEN the RichTextEditor SHALL create a new list item
4. WHEN a user presses Enter on an empty list item THEN the RichTextEditor SHALL exit the list and create a normal paragraph

### Requirement 3

**User Story:** As a user, I want to add blockquotes to my journal, so that I can highlight quotes or important passages.

#### Acceptance Criteria

1. WHEN a user clicks the blockquote button THEN the RichTextEditor SHALL wrap the current paragraph in a blockquote element
2. WHEN a user clicks the blockquote button on an existing blockquote THEN the RichTextEditor SHALL remove the blockquote formatting
3. WHEN the blockquote is displayed THEN the RichTextEditor SHALL render the blockquote with a distinct visual style including left border and background

### Requirement 4

**User Story:** As a user, I want to add code blocks to my journal, so that I can include code snippets or technical notes.

#### Acceptance Criteria

1. WHEN a user clicks the code block button THEN the RichTextEditor SHALL create a code block at the cursor position
2. WHEN a code block is displayed THEN the RichTextEditor SHALL render the code block with monospace font and distinct background
3. WHEN a user types inside a code block THEN the RichTextEditor SHALL preserve whitespace and line breaks exactly as typed

### Requirement 5

**User Story:** As a user, I want the editor toolbar to show the current formatting state, so that I know which formats are active.

#### Acceptance Criteria

1. WHEN the cursor is inside bold text THEN the Toolbar SHALL highlight the bold button as active
2. WHEN the cursor is inside italic text THEN the Toolbar SHALL highlight the italic button as active
3. WHEN the cursor is inside a list THEN the Toolbar SHALL highlight the corresponding list button as active
4. WHEN the cursor is inside a blockquote THEN the Toolbar SHALL highlight the blockquote button as active
5. WHEN the cursor is inside a code block THEN the Toolbar SHALL highlight the code block button as active

### Requirement 6

**User Story:** As a user, I want the rich text content to be saved and displayed correctly, so that my formatting is preserved.

#### Acceptance Criteria

1. WHEN a user adds a journal entry with rich text THEN the system SHALL store the content as HTML string
2. WHEN displaying a saved journal entry THEN the system SHALL render the HTML content with proper formatting
3. WHEN editing an existing journal entry THEN the RichTextEditor SHALL load the HTML content and allow further editing
4. WHEN the RichTextEditor content is serialized THEN the system SHALL produce valid HTML that can be deserialized back to the same editor state

### Requirement 7

**User Story:** As a user, I want the editor to be accessible and responsive, so that I can use it on different devices.

#### Acceptance Criteria

1. WHEN the editor is in readonly mode THEN the Toolbar SHALL be hidden and the content SHALL be non-editable
2. WHEN the editor is displayed on mobile devices THEN the Toolbar SHALL adapt to smaller screens with appropriate button sizing
3. WHEN a user focuses the editor THEN the system SHALL provide visual feedback indicating the active state
4. WHEN the editor is empty THEN the system SHALL display a placeholder text

### Requirement 8

**User Story:** As a user, I want keyboard shortcuts for common formatting actions, so that I can format text quickly.

#### Acceptance Criteria

1. WHEN a user presses Ctrl+Shift+7 THEN the RichTextEditor SHALL toggle ordered list
2. WHEN a user presses Ctrl+Shift+8 THEN the RichTextEditor SHALL toggle bullet list
3. WHEN a user presses Ctrl+Shift+B THEN the RichTextEditor SHALL toggle blockquote
4. WHEN a user presses Ctrl+Alt+C THEN the RichTextEditor SHALL toggle code block
5. WHEN a user presses Ctrl+Enter THEN the system SHALL trigger the add journal action

