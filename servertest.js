import { NodeJSSerialConnection, Connection, Constants } from "@liamcottle/meshcore.js"
import { Tun, Tap } from "tuntap2"

import {exec} from "child_process";



/**
 * @type {Connection}
 */
const con = new NodeJSSerialConnection("/dev/ttyACM0");

await con.connect();

/**
 * @type {Tun}
 */
let tun;

let selfIp = "";

function pubKeyToIp(pubKey){
    const firstThree = pubKey.slice(0,3);
    const threeArr = Array.from(firstThree);

    return `10.${threeArr[0]}.${threeArr[1]}.${threeArr[2]}/8`;
}


con.on("connected", async () =>{
    await con.setRadioParams(915000,500000,7,5);


    const contacts = await con.getContacts();
    console.log("[INFO] Node to ip:")
    for(const contact of contacts) {
        //console.log(contact.publicKey);
        if(contact.type == 1){
            console.log(`[INFO] ${contact.advName}: ${pubKeyToIp(contact.publicKey)}`);
        }
    }



    console.log("[INFO] Connected to node!");

    con.on("disconnected", function(){
        console.warn("[WARN] Radio disconnected")
        process.exit(0);
    });

    

    con.on(Constants.ResponseCodes.SelfInfo, async (data) => {
        try {
            selfIp = pubKeyToIp(data.publicKey);
            tun = new Tun();
            tun.mtu = 180;
            tun.ipv4 = selfIp;
            tun.iface = "tun0";
            //tun.ipv6 = 'abcd:1:2:3::/64';
            
            tun.isUp = true;
            console.log(`[INFO] Created tun: ${tun.name}, ipv4: ${tun.ipv4}, ipv6:${tun.ipv6}, mtu: ${tun.mtu}`);
            exec("sudo tc qdisc add dev tun0 root tbf rate 5kbit burst 15kbit latency 2000ms",function(error, stdout, stderr){
                console.log(stdout);
            })
            tun.on("data", async function(data){
                console.log("[INFO] tx: ",Buffer.from(data))
                if(Buffer.isBuffer(data)){
                    con.sendCommandSendRawData([],data)
                } else {
                    console.warn("[WARN] NOT A BUFFER",data.toString());
                }
            })

            con.on(Constants.PushCodes.RawData, async function(data) {
                console.log("[INFO] rx: ",Buffer.from(data.payload));
                tun.write(Buffer.from(data.payload));
            })

            tun.on("error", function(err){
                console.warn("[WARN] Tap interface error:",err)
            })
        }
        catch(e) {
            console.log('[WARN] Error creating tap: ', e);
            process.exit(0);
        }
    })

    await con.getSelfInfo();
});
