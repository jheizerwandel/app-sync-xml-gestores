const database = require('../db');
const model = require('../Models/config');
const axios = require('axios');

(async () => {
    await model.sync();
})();

const CONFIG = {
	get : async function(k){
		var conf =  await model.findOne({
			where:{
				key : k
			}
		});	
		return conf ? conf.value : null ;
	},
	set : async function(k,v){
		const resultadoCreate = await model.create({
        	key:k,
            value: v,
        })
        return  resultadoCreate ;
	}
}

 
module.exports =  CONFIG ;