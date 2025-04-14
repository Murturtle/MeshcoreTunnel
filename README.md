# MeshcoreTunnel
This little node js script uses the taptun2 library to make a tunnel interface, data gets routed in and out between the raw data packet on meshcore.
It currently does not have routing, and flood routing is disabled, 0-hop only.
### ONLY WORKS ON LINUX

## Setup:
1. download this repository
2. `npm i`
3. plug in your node, make sure that the serial connection is correct in testserver.js
4. `npm run`
