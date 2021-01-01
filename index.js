const pcap = require('pcap');
const pcap_packet = require('pcap/decode/pcap_packet');
const BLELLPacket = require('./ble_ll');
const BLELLPHDRPacket = require('./ble_ll_phdr');
const NordicBlePacket = require('./nordic_ble');

function BlePcap() {
    let extended_dlt = {
        251: "LINKTYPE_BLUETOOTH_LE_LL",
        256: "LINKTYPE_BLUETOOTH_LE_LL_WITH_PHDR",
        272: "LINKTYPE_NORDIC_BLE"
    }

    // Duplicated because original is private
    function PcapHeader(raw_header) {
        this.tv_sec = raw_header.readUInt32LE(0, true);
        this.tv_usec = raw_header.readUInt32LE(4, true);
        this.caplen = raw_header.readUInt32LE(8, true);
        this.len = raw_header.readUInt32LE(12, true);
    }

    function update_link_type(session, link_type) {
        // Retrieve the numberic DLT from the error string
        let dlt = link_type.split(' ').slice(-1).pop();
    
        session.link_type = extended_dlt[dlt];
    }

    this.register_dlts = function() {
        // node-pcap doesn't currently have a mechanism for adding supported DLTs so
        // add the BLE DLTs here through some method swizzling.
        let original_decode = pcap_packet.prototype.decode;

        // replace the original method with our new and updated one
        pcap_packet.prototype.decode = function(packet_with_header, options) {
            this.link_type = packet_with_header.link_type;
            this.pcap_header = new PcapHeader(packet_with_header.header);
        
            var buf = packet_with_header.buf.slice(0, this.pcap_header.caplen);
        
            switch(this.link_type) {
                case 'LINKTYPE_BLUETOOTH_LE_LL':
                    this.payload = new BLELLPacket(this.emitter).decode(buf, 0, options);
                    break;

                case 'LINKTYPE_BLUETOOTH_LE_LL_WITH_PHDR':
                    this.payload = new BLELLPHDRPacket(this.emitter).decode(buf, 0, options);
                    break;
        
                case 'LINKTYPE_NORDIC_BLE':
                    this.payload = new NordicBlePacket(this.emitter).decode(buf, 0, options);
                    break;
        
                default:
                    return original_decode(packet_with_header, options);
            }
        
            return this;
        }

        // More method swizzle
        let original_create_offline_session = pcap.createOfflineSession;
        pcap.createOfflineSession = function(path, options) {
            let session = original_create_offline_session(path, options);

            // save the session as the emitter
            this.emitter = session;

            update_link_type(session, session.link_type);

            return session;
        }
    }
}

module.exports = new BlePcap();
