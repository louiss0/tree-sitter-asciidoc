# Agents Notes

# Limitations

- Tree Sitter doesn't support look ahead regex
- Regex must be JS compatible
- You can't use group regex
- You can't use the same regex twice for nodes
- Don't touch the bindings folder

## Things to do

- If the grammar has a field use that for the query!
- Remove all generated files after sucessful tests
- Ask me about tests before implementing new features
- When I allow you to write tests wait for me to approve them
- If there are nodes that are only for a specific node make it private and use a field to expose it
- Use the scanner to resolve conflicts related to charaters needing to exist in a specific sequence

## Highlight test command (no bash required)

Run the snapshot-based highlighting tests directly via PowerShell using this one-liner:

```powershell
pwsh -NoLogo -NoProfile -Command "
$ErrorActionPreference = 'Stop';
$root = Get-Location;
$cases = Join-Path $root 'test/highlight/cases';
$expected = Join-Path $root 'test/highlight/expected';
$actual = Join-Path $root 'test/highlight/.actual';
if (Test-Path $actual) { Remove-Item $actual -Recurse -Force; }
New-Item -ItemType Directory -Path $actual -Force | Out-Null;
$fail = @();
Get-ChildItem -Path $cases -Filter '*.adoc' | Sort-Object Name | ForEach-Object {
  $base = $_.BaseName;
  Write-Host "Processing $($base)...";
  $actPath = Join-Path $actual ($base + '.captures');
  $expPath = Join-Path $expected ($base + '.captures');
  $output = & npx tree-sitter query -c (Join-Path $root 'queries/highlights.scm') $_.FullName 2>$null;
  $normalized = ($output | ForEach-Object {
    $line = $_ -replace '^[\s`u00A0]+', '';
    $line = $line -replace '\s+', ' ';
    $line.TrimEnd()
  }) -join "`n";
  [System.IO.File]::WriteAllText($actPath, $normalized + "`n");
  if (!(Test-Path $expPath)) {
    Copy-Item $actPath $expPath;
  } elseif ((Get-Content -Raw $expPath) -ne (Get-Content -Raw $actPath)) {
    $fail += $base;
    Write-Warning "Mismatch for $base";
  } else {
    Write-Host '  ok';
  }
};
if ($fail.Count -gt 0) {
  throw "Highlight tests failed: $($fail -join ', ')";
} else {
  Write-Host 'All highlight tests passed.';
}"
```

Pass `--%` before the command if your shell needs literal quoting (e.g., `pwsh --% …`). Use the same snippet with the `Copy-Item` line uncommented to refresh expected captures.

## Quick highlight visualization

Generate an HTML preview for any `.adoc` file with the Tree-sitter CLI:

```powershell
pwsh -NoLogo -NoProfile -Command "
$ErrorActionPreference = 'Stop';
$root = Get-Location;
$source = Join-Path $root 'test/highlight/cases/comprehensive.adoc';
$html = Join-Path $root 'test/highlight/.actual/comprehensive.html';
npx tree-sitter highlight --html $source > $html;
Write-Host 'Saved highlight preview to ' + $html;
"
```

Edit `$source`/`$html` to point at any document you want to inspect, then open the generated HTML in a browser to see the captures visually.
