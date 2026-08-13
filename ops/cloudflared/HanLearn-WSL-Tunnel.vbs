Set shell = CreateObject("WScript.Shell")
shell.Run "wsl.exe -d Ubuntu-24.04 --exec /bin/sleep infinity", 0, False
