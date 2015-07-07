var evtDispatcher = (function (){
	var evts = [];

	function addEvt(obj) {
		/* obj = {
				type: string,
				event: function(){},
	 } */
		evts.push(obj);
	}

	function fireEvt(type, args) {
		evts.filter(function(eventDetails){
			return eventDetails.type === type;
		}).some(function(eventDetails){
			try {
				return eventDetails.event.call(undefined, args);
			} catch (error) {

			}
		});
	}

	return {
		addEvt: addEvt,
		fireEvt: fireEvt
	};
})();