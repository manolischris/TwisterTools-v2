$path = "c:\Users\Manolis\Documents\Apps\twistertools-workspace\twistertools-v2\components\tools\HtmlToMarkdown.tsx"
$content = Get-Content $path -Raw

# Replace the escapeHtml function body
$old = @"
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """)
    .replace(/'/g, "&#039;");
}
"@

$new = @"
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """)
    .replace(/'/g, "&#039;");
}
"@

$content = $content.Replace($old, $new)
Set-Content $path $content -Encoding UTF8
Write-Host "Done"
</｜｜DSML｜｜content>
</write_to_file>