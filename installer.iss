[Setup]
AppName=IVFTax
AppVersion=1.0
DefaultDirName={pf}\IVFTax
DefaultGroupName=IVFTax
OutputDir=.\instaladores
OutputBaseFilename=IVFTax_Installer
Compression=lzma
SolidCompression=yes

[Files]
Source: "dist\IVFTax.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\MeuApp"; Filename: "{app}\IVFTax.exe"

[Run]
Filename: "{app}\IVFTax.exe"; Description: "Executar IVFTax"; Flags: nowait postinstall skipifsilent
