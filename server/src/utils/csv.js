// 极简 CSV 转义：含逗号、引号、换行的字段加双引号，内部引号双写。
function escapeCell(value) {
  const s = value == null ? '' : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

// UTF-8 BOM（U+FEFF），保证 Excel 打开 CSV 中文不乱码。
// 用 fromCharCode 显式构造，避免在源码里直接写字面 BOM 被编码工具改写。
export const UTF8_BOM = String.fromCharCode(0xfeff)

// 生成 CSV 文本，带 UTF-8 BOM。
export function toCsv(headers, rows) {
  const lines = [headers.map(escapeCell).join(',')]
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','))
  }
  return UTF8_BOM + lines.join('\r\n')
}
