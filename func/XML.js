const fs = require("fs");
const xml2js = require('xml2js');
const util = require('util');
const _ = require('lodash');
const path = require('path');
//abs_path;
const database = require('../db');
const modelFile = require('../Models/uploadedFile');

const XML = {
	isValid : function (path_name,after) {
		r = false ;
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
		        		r =  result.nfeProc.protNFe[0].infProt[0] ;

		        		var aamm = ( r.chNFe[0]+"" ).substring(2,6);
		        		if( !(aamm >=after) ){
		        			r = false ;	
		        		}

		        	}
		        }
		    });
		} catch (error) {
		    //console.log(error);
		}
		return r!=false;
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