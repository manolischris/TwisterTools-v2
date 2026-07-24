import os

p = r'c:\Users\Manolis\Documents\Apps\twistertools-workspace\twistertools-v2\components\tools\HtmlToMarkdown.tsx'
c = open(p, 'r', encoding='utf8').read()

# Replace decoded HTML entities with proper entity references
c = c.replace('.replace(/&/g, "&")', '.replace(/&/g, "&")')
c = c.replace('.replace(/</g, "<")', '.replace(/</g, "<")')
c = c.replace('.replace(/>/g, ">")', '.replace(/>/g, ">")')
c = c.replace('.replace(/"/g, """)', '.replace(/"/g, """)')

open(p, 'w', encoding='utf8').write(c)
print('escapeHtml function fixed successfully')
