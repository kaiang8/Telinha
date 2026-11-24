'use strict';
// Roda depois que o programa é montado e antes do instalador: desliga recursos do
// Electron que só serviriam para alguém usar o programa como porta de entrada.
const path = require('node:path');
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses');

exports.default = async function fusiveis(ctx) {
  const ext = { win32: '.exe', darwin: '.app', linux: '' }[ctx.electronPlatformName] ?? '';
  const exe = path.join(ctx.appOutDir, `${ctx.packager.appInfo.productFilename}${ext}`);
  await flipFuses(exe, {
    version: FuseVersion.V1,
    resetAdHocDarwinSignature: ctx.electronPlatformName === 'darwin',
    [FuseV1Options.RunAsNode]: false, // ninguém consegue usar o programa como um "node.exe"
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false, // NODE_OPTIONS ignorado
    [FuseV1Options.EnableNodeCliInspectArguments]: false, // sem --inspect (depuração remota)
    [FuseV1Options.EnableCookieEncryption]: true, // cookies criptografados pelo Windows
    [FuseV1Options.OnlyLoadAppFromAsar]: true, // só carrega o código empacotado
  });
  console.log(`  • fusíveis de segurança aplicados em ${path.basename(exe)}`);
};
