// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

/**
** Comando para copilar 
** electron-packager C:/wamp64/www/electron nome_da_pasta
**/

global.j = require('./assets/js/jquery-2.2.4.js');
global.moment = require('./assets/js/moment.js');

var config ;

function getDateBr(d,s){
    s = s ? s : '/' ;
    if(d)
        var df = new Date(d);
    else
        var df = new Date();

    return ( (df.getDate()+"").padStart(2, '0') )+s+( ((df.getMonth()+1)+"").padStart(2, '0') )+s+( df.getFullYear() )+" "+( (df.getHours()+"").padStart(2, '0') )+
                        ":"+( (df.getMinutes()+"").padStart(2, '0') );
}

j.fn.btn = function (action){
	if(action == 'loading'){
		this.attr('data-old-text',this.html());
		this.html(this.data('loading-text'));
	}else if(action=='reset'){
		this.html(this.data('old-text'));		
	}
};

if (window.module) module = window.module;
const { ipcRenderer } = require('electron');

function logar(){
	var login = j('#login').val();
	var password = j('#password').val();
	j('#logar').btn('loading');
	ipcRenderer.send('logar',{login_user:login,password_user:password});		
}

document.getElementById('logar').addEventListener('click', (evt) => {
 	evt.preventDefault();
 	logar();
});

ipcRenderer.on('main/sendEnterprises', function(event, res) {
	j('#logar').btn('reset');
	if(j.isArray(res.msg)){
		if(res.msg.length > 0){
			j('#select-enterprises').prop('disabled', false);
		}
		j('#select-enterprises').html('');

		var o = new Option('', '');
		j(o).html('');
		j('#select-enterprises').append(o);

		j.each(res.msg,function(i,v){
			var o = new Option(v.name_enterprise, v.id_enterprise);
			j(o).html(v.name_enterprise);
			j('#select-enterprises').append(o);
		});

		if(config && config.id_enterprise)
			j("#select-enterprises").val(config.id_enterprise).change();
	}
});

j('#btn-salvar').click(function(e){
	j('#btn-salvar').btn('loading');
	var login = j('#login').val();
	var password = j('#password').val();
	var id_enterprise = j('#select-enterprises').val();
	var lastUpdate = j('#last-update-br').val();
	var paths = [] ;

	j.each(j('#t-file .item'),function(i,v){
		paths.push(j(v).data('path'));
	});

	var msg = "";
	if(!login || !password){
		msg += '- Informe seus dados de login\n';
	}

	if(!id_enterprise){
		msg += '- Selecione uma empresa\n';
	}

	if(paths.length == 0){
		msg += '- Selecione uma pasta ao menos\n';
	}

	if(lastUpdate){
		if(!moment(lastUpdate,'DD/MM/YYYY HH:mm',true).isValid()){
			msg += '- data invalida\n';	
		}
	}

	if(msg){
		alert(msg);
		j('#btn-salvar').btn('reset');
		return 
	}

	if(lastUpdate){
		lastUpdate = moment(lastUpdate,'DD/MM/YYYY HH:mm').format('YYYY/MM/DD HH:mm');
	}else{
		lastUpdate = '1970/01/01 00:00';
	}

	var obj = {
		login : login,
		password : password,
		id_enterprise : id_enterprise,
		paths : paths,
		lastUpdate : lastUpdate	
	}
	
	ipcRenderer.send('saveConfig',{json:JSON.stringify(obj)});		
});

ipcRenderer.on('main/resSaveConfig', function(event, res) {
	j('#btn-salvar').btn('reset');
	if(res.status == 'success'){
		alert('Configurações salvas com sucesso');
		//ipcRenderer.send('hideMainWindow',{});	
	}else{
		alert('Erro ao salvar configurações');	
	}
});

/* RECEBE LISTA DE DIRTORIOS CONFIGURADOS*/
ipcRenderer.on('main/sendConfig', function(event, res) {
	config = res.msg ;
	console.log(config);

	if(config.login){
		j('#login').val(config.login);
	}

	if(config.password){
		j('#password').val(config.password);
	}

	if(config.login && config.password){
		logar();
	}

	if(config.lastUpdate){
		var lastUpdateBR = getDateBr(config.lastUpdate);
		j('#last-update-br').val(lastUpdateBR);
	}

	if(typeof config == 'object'  && config.paths && Array.isArray(config.paths)){
		j.each(config.paths,function(i,v){
			var i = j('#t-file .item').length ? j('#t-file .item').length : 0 ;
			var tr = [
				"<tr class=\"item\" data-index=\""+i+"\" data-path=\""+v+"\">",
	            "   <td colspan=\"3\">",
	            "      "+v,
	            "   </td>",
	            "   <td>",
	            "      <a class=\"badge badge-pill bg-danger pointer del-path\" >",
	            "         <i class=\"fa fa-trash\" title=\"excluir\"></i>",
	            "      </a>  ",
	            "   </td>",
	            "</tr>",
			].join('');
		 	j('#t-file tbody').append(tr);
		 	j('#t-file .unselected').hide();
		});	
	}
});

ipcRenderer.on('main/sendLastUpdate', function(event, res) {
	if(res.lastUpdate){
		var lastUpdateBR = getDateBr(res.lastUpdate);
		j('#last-update-br').val(lastUpdateBR);
	}
});


/* DISPARA EVENTO PARA SELECIONAR E LER ARQUIVOS NA PASTA */
	document.getElementById('btn').addEventListener('click', (evt) => {
	  evt.preventDefault();
	  ipcRenderer.send('select-dirs');
	});
/* END */

/* RECEBE ARQUIVOS PARA INSERIR NA TELA */
	ipcRenderer.on('main/sendPath', function(event, res) {
		var i = j('#t-file .item').length ? j('#t-file .item').length : 0 ;
		var tr = [
			"<tr class=\"item\" data-index=\""+i+"\" data-path=\""+res.msg+"\">",
            "   <td colspan=\"3\">",
            "      "+res.msg,
            "   </td>",
            "   <td>",
            "      <a class=\"badge badge-pill bg-danger pointer del-path\" >",
            "         <i class=\"fa fa-trash\" title=\"excluir\"></i>",
            "      </a>  ",
            "   </td>",
            "</tr>",
		].join('');
	 	j('#t-file tbody').append(tr);
	 	j('#t-file .unselected').hide();
	})

	j('body').on('click','.del-path',function(){
		var i = j(this).closest('tr').data('index');
		j(this).closest('tr').remove();
		if(!j('#t-file .item').length){
			j('#t-file .unselected').show();	
		}
	});
/* END*/