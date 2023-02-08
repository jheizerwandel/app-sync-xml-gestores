const moment = require('moment');
const DATE = {
    prevMonth : function (amount=1,format='AAMM'){
        format = format.replaceAll('A','Y');
        return moment().subtract(1, 'month').format(format);
    }
}

module.exports =  DATE ;