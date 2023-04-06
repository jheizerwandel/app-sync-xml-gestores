const fs = require("fs");
const xml2js = require('xml2js');
const util = require('util');
const _ = require('lodash');
const path = require('path');
//abs_path;
const database = require('../db');
const modelFile = require('../Models/uploadedFile');

(async () => {
    await modelFile.sync();
})();

const XML = {
	isValid : function (path_name,after) {
		let r = false;
		let status = '';
		try { 
			if (!fs.existsSync(path_name)) return false ;		 

			var ext = path.extname(path_name);
			if(ext != '.xml') return false ;

		    const parser = new xml2js.Parser({ attrkey: "ATTR" });

		    let xml_string =  fs.readFileSync(path_name, "utf8");
		    parser.parseString(xml_string, function(error, result) {
		        if(error === null) {
		        	var infProt = _.get(result,'nfeProc.protNFe[0].infProt[0]');
		        	if(typeof infProt === 'object' && _.get(infProt,'cStat[0]') == 100	){
						status = 'autorizada'
		        		r =  result.nfeProc.protNFe[0].infProt[0] ;

		        		var aamm = ( r.chNFe[0]+"" ).substring(2,6);
		        		if( !(aamm >=after) ){
		        			r = false ;
		        		}

		        	}else{
						var descEvento = _.get(result,'procEventoNFe.evento[0].infEvento[0].detEvento[0].descEvento[0]');
						if(descEvento && descEvento.toLowerCase() == 'cancelamento'){
							status = 'cancelada'
							var chNFe = _.get(result,'procEventoNFe.evento[0].infEvento[0].chNFe[0]');
							var aamm = ( chNFe+"" ).substring(2,6);
							console.log(aamm,after);
							if( !(aamm >=after) ){
								r = false ;
							}else{
								r = true ;
							}
						}
					}
		        }
		    });
		} catch (error) {
		    //console.log(error);
		}
		return r!=false ? {isValid:true,status:status} : {isValid:false} ;
	},
	saveAsSent : async function(path){
		try {
	        const resultadoCreate = await modelFile.create({
	            path: path,
	        })
	        return  resultadoCreate ;
	    } catch (error) {
	        console.log(error);
	    }
	},
	exists : async function(path){
		const xml =  modelFile.findOne({
			where:{
				path : path
			}
		});

		return xml ;
	}
}

 
module.exports = XML;