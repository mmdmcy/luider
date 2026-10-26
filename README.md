# Luider

A browser extension that turns a tab up past 100%. One slider, from 10% to
600%, remembered per site. Nothing else: no accounts, no network, no
analytics, no background process.

"Luider" is Dutch for "louder".

## How it works

Sound on a web page comes out of `<audio>` and `<video>` elements. Luider
routes those through a Web Audio gain node on the page itself and sets the
gain to what the slider says. The elements are not moved, wrapped or replaced,
so the player's own controls, fullscreen and keyboard shortcuts keep working.
At 100% nothing is attached at all, so a page you never boosted sounds exactly
as before.

A player whose sound comes from another site without CORS headers would turn
silent inside Web Audio; Luider leaves such players alone and says so in the
popup. YouTube, Twitch, Netflix-style players with same-origin or blob media
are fine.

## Install

Chrome, Brave, Edge: `chrome://extensions`, turn on Developer mode, "Load
unpacked", pick this folder.

Firefox: `about:debugging#/runtime/this-firefox`, "Load Temporary Add-on",
pick `manifest.json`. (A signed build for permanent install is a later step.)

## Use

Click the icon, drag the slider or press one of the buttons. The badge on the
icon shows the boost while it is above 100%. Loud is loud: a cheap speaker or
earphones can distort or hurt above 300%.

## Files

- `manifest.json`: Manifest V3, works in Chromium browsers and Firefox 121+.
- `content.js`: runs on every page; attaches the gain when asked.
- `popup.html`, `popup.js`: the slider.
- `icons/`: generated speaker icons.

No build step, no dependencies. MIT.
