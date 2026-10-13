[CmdletBinding()]
param(
  [string]$OutputDirectory = (Split-Path -Parent $PSScriptRoot),
  [string]$MinimumVersionExclusive
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $repositoryRoot 'GPTprompt'
$manifestPath = Join-Path $sourceRoot 'manifest.json'
$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
$archivePath = Join-Path $OutputDirectory "AI-Prompts-Plus-v$($manifest.version).zip"
$stagingRoot = Join-Path ([IO.Path]::GetTempPath()) "ai-prompts-plus-release-$([guid]::NewGuid())"

try {
  $manifestVersion = [version]$manifest.version
} catch {
  throw "Manifest version is invalid: $($manifest.version)"
}

if ($MinimumVersionExclusive) {
  try {
    $minimumVersion = [version]$MinimumVersionExclusive
  } catch {
    throw "Minimum version is invalid: $MinimumVersionExclusive"
  }
  if ($manifestVersion -le $minimumVersion) {
    throw "Manifest version $manifestVersion must be greater than $minimumVersion."
  }
}

function Get-ManifestFiles {
  $files = @(
    $manifest.action.default_popup
    $manifest.background.service_worker
    $manifest.icons.PSObject.Properties.Value
    $manifest.action.default_icon.PSObject.Properties.Value
    $manifest.content_scripts.js
    $manifest.content_scripts.css
    $manifest.web_accessible_resources.resources
  )
  return @($files | Where-Object { $_ } | Sort-Object -Unique)
}

function Assert-ArchiveEntry {
  param(
    [System.IO.Compression.ZipArchive]$Archive,
    [string]$EntryName
  )

  $normalizedName = $EntryName.Replace('\', '/')
  if (-not $Archive.GetEntry($normalizedName)) {
    throw "Release archive is missing required file: $normalizedName"
  }
}

New-Item -ItemType Directory -Path $stagingRoot | Out-Null
try {
  Get-ChildItem -LiteralPath $sourceRoot -File |
    Where-Object { $_.Extension -in @('.js', '.css', '.html', '.json') } |
    Copy-Item -Destination $stagingRoot

  foreach ($directoryName in @('icons', '_locales')) {
    Copy-Item -Recurse -LiteralPath (Join-Path $sourceRoot $directoryName) -Destination $stagingRoot
  }

  Compress-Archive -Path (Join-Path $stagingRoot '*') -DestinationPath $archivePath -CompressionLevel Optimal -Force

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
  try {
    foreach ($file in Get-ManifestFiles) {
      Assert-ArchiveEntry -Archive $archive -EntryName $file
    }

    foreach ($scriptEntry in @($archive.Entries | Where-Object { $_.FullName -like '*.js' })) {
      $reader = [IO.StreamReader]::new($scriptEntry.Open())
      try {
        $source = $reader.ReadToEnd()
      } finally {
        $reader.Dispose()
      }

      foreach ($importMatch in [regex]::Matches($source, 'importScripts\(([^)]+)\)')) {
        foreach ($fileMatch in [regex]::Matches($importMatch.Groups[1].Value, '["'']([^"'']+)["'']')) {
          Assert-ArchiveEntry -Archive $archive -EntryName $fileMatch.Groups[1].Value
        }
      }
    }
  } finally {
    $archive.Dispose()
  }

  $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $archivePath
  [pscustomobject]@{
    Path = $archivePath
    Version = $manifest.version
    Sha256 = $hash.Hash
  }
} finally {
  $resolvedStaging = [IO.Path]::GetFullPath($stagingRoot)
  $resolvedTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
  if (-not $resolvedStaging.StartsWith($resolvedTemp, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove staging directory outside the temp root: $resolvedStaging"
  }
  if (Test-Path -LiteralPath $resolvedStaging) {
    Remove-Item -Recurse -Force -LiteralPath $resolvedStaging
  }
}
