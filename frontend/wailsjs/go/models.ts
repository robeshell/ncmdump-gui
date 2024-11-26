export namespace main {
	
	export class NcmFile {
	    Name: string;
	    Status: string;
	
	    static createFrom(source: any = {}) {
	        return new NcmFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Status = source["Status"];
	    }
	}

}

