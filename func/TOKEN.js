const database = require('../db');
const model = require('../Models/config');
const axios = require('axios');

(async () => {
    await model.sync();
})();

const TOKEN = {
	config : {},
	getUser : async function(){
	    try {
        var response = await axios.post(this.config.url_api+'auth', {
            login_user:this.config.login,password_user:this.config.password
        });
        return response.data ;
	    } catch (error) {
	        console.log(error);
	    }

	},
	set: async function(){
		user = await this.getUser();
		item = await this.getModel();
		if(item){
			await item.update({
				value : user.token	
			});
		}else{

			try {
		        const resultadoCreate = await model.create({
		        	key:'token',
		            value: user.token,
		        })
		        return  resultadoCreate ;
		    } catch (error) {
		        console.log(error);
		    }
	    }

	    return user.token ;
	},
	getModel : async function(){
		var token =  await model.findOne({
			where:{
				key : 'token'
			}
		});	
		return token ;
	},
	diffMinutes : function(date1) {
    	const d1 = new Date(date1).getTime();
    	const d2 = new Date().getTime();
    	return Math.round((d2 - d1) / 60000);
    },
	get : async function(){

		var token =  await model.findOne({
			where:{
				key : 'token'
			}
		});

		if(!token || this.diffMinutes(token.updatedAt) > 50){
			token =  await this.set();	
		}

		return token.value
		
	}
}

 
module.exports =  TOKEN ;