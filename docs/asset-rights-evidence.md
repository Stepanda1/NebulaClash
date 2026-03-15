# Asset Rights Evidence

Last updated: `2026-03-16`

This file records the provenance evidence currently available in the repository for the shipped music and graphic assets.

## 1. Background Music

Current shipped files:

- [public/bgm.mp3](/C:/Users/stepa/OneDrive/Рабочий%20стол/Nebula%20Clash%20Docs/01_Game/NebulaClashRelease%20v1.0.0/public/bgm.mp3)
- [public/bgm.ogg](/C:/Users/stepa/OneDrive/Рабочий%20стол/Nebula%20Clash%20Docs/01_Game/NebulaClashRelease%20v1.0.0/public/bgm.ogg)

Repository attribution already present in code:

- [AudioPlayer.tsx](/C:/Users/stepa/OneDrive/Рабочий%20стол/Nebula%20Clash%20Docs/01_Game/NebulaClashRelease%20v1.0.0/src/components/AudioPlayer.tsx) states:
  - title: `Outer Space Loop`
  - author: `wipics`
  - source: `https://opengameart.org/content/outer-space-loop`
  - license: `CC0 1.0`

Public source checked:

- OpenGameArt page: https://opengameart.org/content/outer-space-loop
- License on source page: `CC0`
- Copyright / attribution notice on source page: `Public Domain`

Local file hashes:

- `public/bgm.mp3`
  - `SHA256 A47FD0A3B89B697203B7B3BDBAEDD6C02F1AAE663A723F4287F3C1181C37115E`
- `public/bgm.ogg`
  - `SHA256 6E02A32D963B84061CDEEC66CC852E731E367C93EF572AA169B1BAADBCDC20BA`

Assessment:

- Current repository contains a concrete source URL, a declared CC0/public-domain basis, and exact file hashes for the shipped audio files.
- This is acceptable provenance evidence for the current shipped music.

## 2. Shipped Graphic Assets

Main shipped files checked:

- [public/sprites.png](/C:/Users/stepa/OneDrive/Рабочий%20стол/Nebula%20Clash%20Docs/01_Game/NebulaClashRelease%20v1.0.0/public/sprites.png)
- [public/gems_new.png](/C:/Users/stepa/OneDrive/Рабочий%20стол/Nebula%20Clash%20Docs/01_Game/NebulaClashRelease%20v1.0.0/public/gems_new.png)
- [public/gems/blue.png](/C:/Users/stepa/OneDrive/Рабочий%20стол/Nebula%20Clash%20Docs/01_Game/NebulaClashRelease%20v1.0.0/public/gems/blue.png)
- [public/gems/green.png](/C:/Users/stepa/OneDrive/Рабочий%20стол/Nebula%20Clash%20Docs/01_Game/NebulaClashRelease%20v1.0.0/public/gems/green.png)
- [public/gems/red.png](/C:/Users/stepa/OneDrive/Рабочий%20стол/Nebula%20Clash%20Docs/01_Game/NebulaClashRelease%20v1.0.0/public/gems/red.png)
- [public/gems/yellow.png](/C:/Users/stepa/OneDrive/Рабочий%20стол/Nebula%20Clash%20Docs/01_Game/NebulaClashRelease%20v1.0.0/public/gems/yellow.png)

Local evidence available inside the files:

- The PNG files contain embedded C2PA-style strings indicating:
  - `Created by Google Generative AI`
  - `digitalSourceType ... trainedAlgorithmicMedia`

That evidence was observed directly in the binary files during local inspection.

Local file hashes:

- `public/sprites.png`
  - `SHA256 AD91CA73D7B1B0A5B7AF17BE83EF0E874AF1919B3A6EC1444030086F12B47E5E`
- `public/gems_new.png`
  - `SHA256 C1E2D37FEE94B5664D6C1030950CA23D9C78A4C2C49F86C6AC66A0AB9E120BD3`
- `public/gems/blue.png`
  - `SHA256 3D97F62829EC46A40DAC9C768C1DD5837F9240A10C89C315AEE53CEE17762F85`
- `public/gems/green.png`
  - `SHA256 F3A6598436E8CECC62AF2596B02DFB24E3BCA02F0EB76546AD8B8CC19D597DAF`
- `public/gems/red.png`
  - `SHA256 42CCAE6FFB797B6731822EDA39075056DB33AA58494E58F828A134E905921DA1`
- `public/gems/yellow.png`
  - `SHA256 AB383E5C37DA13BCC4DF5A24C0B8752F2B9D9DD5814585C3BA1D7B1FF00E98B1`

Assessment:

- I did not find an older saved vendor invoice, stock license file, or prompt/export archive for these graphics in the repository.
- What is saved now is the strongest local evidence currently available in the workspace:
  - the shipped files themselves
  - their hashes
  - the embedded AI-generation metadata inside those files

## 3. What This Means

Music:

- provenance is documented and linked to a public CC0 source

Graphics:

- provenance is partially documented
- there is evidence the current shipped files were AI-generated
- there is not yet a stronger original-generation archive in the repository, such as:
  - original export session
  - prompt log
  - tool account record
  - dated source bundle

## 4. Recommended Next Step For Stronger Records

If you still have the original generation session or exported source bundle for the gem / sprite images, save them outside the public build and record:

- tool used
- generation date
- source account
- original exported filenames
- any prompt / seed / project note available

If those originals are gone, keep this file plus the hashed assets as the current evidence baseline and avoid silently replacing these files in future releases without updating this record.
