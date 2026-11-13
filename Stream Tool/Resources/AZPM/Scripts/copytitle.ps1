# Copies a VOD title for the current match to the clipboard:
#   Tournament - Round - Player One (Character) VS Player Two (Character)
# Run it through copytitle.bat (next to the Stream Tool exe) while the Stream Tool is open.
#
# It asks the Stream Tool for the current game data the same way the overlays do
# (websocket on port 8080), so it always matches what was last sent with "Update".
# Based on the copytitle.bat by @jumbaloni from the AZPM 2022 Stream Tool.

param(
    [string]$Url = "ws://localhost:8080/?id=gameData",
    [switch]$NoClipboard
)

$ErrorActionPreference = "Stop"

function Get-GameData {
    $socket = New-Object System.Net.WebSockets.ClientWebSocket
    $timeout = New-Object System.Threading.CancellationTokenSource
    $timeout.CancelAfter(5000)
    try {
        $socket.ConnectAsync([Uri]$Url, $timeout.Token).GetAwaiter().GetResult()
        $buffer = New-Object byte[] 65536
        $segment = New-Object System.ArraySegment[byte] -ArgumentList @(, $buffer)
        $stream = New-Object System.IO.MemoryStream
        do {
            $result = $socket.ReceiveAsync($segment, $timeout.Token).GetAwaiter().GetResult()
            $stream.Write($buffer, 0, $result.Count)
        } until ($result.EndOfMessage)
        return [System.Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
    } finally {
        $socket.Dispose()
    }
}

# "Name (Character)"; Random shows the team colour instead, CPU shows nothing
function Format-Side($data, [int]$side) {
    $players = @($data.player[$side])
    if ($data.gamemode -eq 2) { $players += $data.player[$side + 2] }
    $players = @($players | Where-Object { $_ -and $_.name })

    $names = ($players | ForEach-Object { $_.name }) -join " & "
    $chars = @($players | ForEach-Object {
        if ($_.char -eq "Random") { $data.color[$side].name }
        elseif ($_.char -ne "CPU") { $_.char }
    } | Where-Object { $_ } | Select-Object -Unique)

    if ($chars.Count -gt 0) { return "$names ($($chars -join ', '))" }
    return $names
}

try {
    $data = Get-GameData
} catch {
    Write-Host "Could not get the match info. Is the Stream Tool open?"
    Write-Host $_.Exception.Message
    exit 1
}

# blank fields (no tournament name, for example) are left out
$title = (@($data.tournamentName, $data.round, "$(Format-Side $data 0) VS $(Format-Side $data 1)") |
    Where-Object { $_ }) -join " - "

if (-not $NoClipboard) { Set-Clipboard -Value $title }
Write-Host $title
Write-Host "Copied!"
