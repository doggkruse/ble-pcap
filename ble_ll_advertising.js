const bluetooth = require('bluetooth-numbers-database');

const ADV_IND           = 0x00;
const ADV_DIRECT_IND    = 0x01;
const ADV_NONCONN_IND   = 0x02;
const SCAN_REQ          = 0x03;
const SCAN_RSP          = 0x04;
const CONNECT_IND       = 0x05;
const ADV_SCAN_IND      = 0x06;

function BleAdv(emitter) {
    this.emitter = emitter;

    this.adv_address = undefined;
    this.complete_local_name = undefined;
}
BleAdv.prototype.decoderName = "ble_adv";

Buffer.prototype.toAddressString = function() {
    return this.toString('hex').split(/(..)/g).filter(s => s).reverse().join(':');
}

BleAdv.prototype.decode = function(pdu_type, raw_packet, offset) {
    // todo parse advertising data

    // Dispatch to sub parser based on pdu_type
    switch(pdu_type) {
        case ADV_IND:
        case ADV_NONCONN_IND:
        case SCAN_RSP:
            this.adv_address = raw_packet.slice(offset, offset + 6).toAddressString();
            offset += 6;

            while(offset < raw_packet.length - 3) {
                let len = raw_packet[offset++] -1;
                let adv_tag = raw_packet[offset++];

                let tag_data = raw_packet.slice(offset, offset + len);
                offset += len;

                switch(adv_tag) {
                    case 0x01:
                        this.flags = {
                            has_flags: true
                        }
                        break;
        
                    case 0x08:    
                    case 0x09:
                        this.complete_local_name = tag_data.toString('utf-8');
                        break;

                    case 0x0a:
                        this.tx_power = tag_data[0];
                        break;

                    case 0xFF:
                        let company_id = tag_data.readUInt16LE(0);
                        let company_name;

                        if(company_id < bluetooth.companies.length) {
                            company_name = bluetooth.companies[company_id].name;
                        }
                        this.manufacturer_data = {
                            company_id: company_id,
                            company_name: company_name,
                            data: tag_data.slice(2)
                        }
                        break;

                    default:
                        // there's a lot more
                        break;
                }
            }
            break;

        case CONNECT_IND:
            // initiator address (6)
            this.initiator_address = raw_packet.slice(offset, offset + 6).toAddressString();
            offset += 6;

            // advertising address (6)
            this.adv_address = raw_packet.slice(offset, offset + 6).toAddressString();
            offset += 6;

            // advertising address (4)
            this.access_address = raw_packet.readUInt32LE(offset);
            offset += 4;

            // todo get the rest of the connection params
            break;

        case ADV_DIRECT_IND:
            this.adv_address = raw_packet.slice(offset, offset + 6).toAddressString();
            offset += 6;
            this.target_address = raw_packet.slice(offset, offset + 6).toAddressString();
            offset += 6;
            // all done!
        break;

        case SCAN_REQ:
            this.scanner_address = raw_packet.slice(offset, offset + 6).toAddressString();
            offset += 6;
            this.adv_address = raw_packet.slice(offset, offset + 6).toAddressString();
            offset += 6;
            // all done!
        break;

        default:
            console.log(pdu_type);
        break;
    }

    if(this.emitter) {
        this.emitter.emit(this.decoderName, this);
    }

    return this;
}

module.exports = BleAdv;