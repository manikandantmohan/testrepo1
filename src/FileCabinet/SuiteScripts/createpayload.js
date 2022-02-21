/**
 * @NApiVersion 2.1
 */
define([], () => {
    /**
     * @description To create the payload dynamically.
     * @author Manikandan T.m.
     * @param {object}
     * @return {object}
     */
    const createApiPayload = (data) => {
        let dataArray = data['data'];
        if (dataArray.length > 0) {
        let dataMapObj = {
            "document_sid": dataArray[0]['Document Number']['value'] || null,
            "label": data['printLabel'] ? data['printLabel'] : null,
            "action": data['printAction'] ? data['printAction'] : null,
            "items": []
        };
        let dataMapArray = {
            "item_sid": null,
            "upc": null,
            "sbs_no": null,
            "alu": null,
            "style_sid": null,
            "dcs_code": null,
            "description1": null,
            "description2": null,
            "description3": null,
            "description4": null,
            "long_description": null,
            "item_no": null,
            "vend_code": null,
            "attr": null,
            "gtin": null,
            "siz": null,
            "cost": null,
            "text1": null,
            "text2": null,
            "text3": null,
            "text4": null,
            "text5": null,
            "text6": null,
            "text7": null,
            "text8": null,
            "text9": null,
            "text10": null,
            "udf_1": null,
            "udf_2": null,
            "udf_3": null,
            "udf_4": null,
            "udf_5": null,
            "udf_6": null,
            "udf_7": null,
            "udf_8": null,
            "udf_9": null,
            "udf_10": null,
            "udf_11": null,
            "udf_12": null,
            "udf_13": null,
            "udf_14": null,
            "dcs_name": null,
            "dcs_Long_name": null,
            "d_name": null,
            "d_long_name": null,
            "department": null,
            "dept_long_name": null,
            "c_name": null,
            "c_long_name": null,
            "class": null,
            "class_long_name": null,
            "s_name": null,
            "s_long_name": null,
            "subclass": null,
            "subclass_long_name": null,
            "season_id": null,
            "price": null,
            "sbs_name": null,
            "region_name": null,
            "sector_name": null
        };
        for (let counter = 0; counter < dataArray.length; counter++) {
                let obj = {};
                let itemObj = { "item": {}, "quantity": null };
                for (let key in dataMapArray) {
                    if (dataMapArray.hasOwnProperty(key)) {
                        obj[key] = dataArray[counter][key]['value'] || dataArray[counter][key]['text'];
                    }
                }
                itemObj['item'] = obj;
                itemObj['quantity'] = dataArray[counter]['quantity']['value'] || dataArray[counter]['quantity']['text'];
                dataMapObj['items'].push(itemObj);
            }
            return dataMapObj
        } else {
            return { status: 'FAILURE', reason: 'NO_ITEM_FOR_PRINT', data: null };
        }
    }
    return { createApiPayload }
});
