//V3D Reader file
//Put all exports at the top of other files
"use scrict";

//We need to use browserify to
//make the require for the dependancies work
let gzip = require("gzip-js"),

    options = {
        level: 9,
    }
;
const { assert } = require("console");
let xdr = require("js-xdr");
class V3DReader{
    /*
    * @todo add other v3d objects
    */

    constructor(fil){
        //To keep track of how many bytes we have read so we can 
        // simulate moving the file reader by making sub arrays
        this.bytesRead = 0; 
        this.file = fil;
        this.objects = [];
        this.materials = [];
        this.centeres = [];
        this.header = new v3dobjects.V3DHeaderInformation(); 
        this.file_ver = null;
        this.processed = false;
        this.object_process_fns = function(type){
            switch (type) {
                case v3dtypes.v3dheadertypes_header:
                    return this.process_header; 
                    break;
                case v3dtypes.v3dtypes_header:
                    return this.process_header;
                    break;
                case v3dtypes.v3dtypes_bezierPatch:
                    return this.process_bezierpatch;
                    break;
                case v3dtypes.v3dtypes_bezierTriangle:
                    return this.process_beziertriangle;
                    break;
                default:
                    return undefined;
            }
          }
          /*
          this.object_process_fns = {
              v3dtypes_bezierPatch: this.process_bezierpatch,
              v3dtypes_header : this.process_header
          };
        console.log(this.object_process_fns[v3dtypes.v3dtypes_bezierPatch]);
        */
    }

    unpack_bool(){
        let ret_val = xdr.Bool.fromXDR(this.file.slice(this.bytesRead, this.bytesRead + 4 + 1));
        this.bytesRead += 4;
        return ret_val;
    }

    unpack_double(){
        let ret_val =  xdr.Double.fromXDR(this.file.slice(this.bytesRead, this.bytesRead + 8 + 1));
        this.bytesRead += 8;
        return ret_val;
    }

    unpack_float(){
       let ret_val = xdr.Float.fromXDR(this.file.slice(this.bytesRead, this.bytesRead + 4 + 1));
       this.bytesRead += 4;
       return ret_val;
    }

    unpack_unsigned_int(){
        let ret_val = xdr.UnsignedInt.fromXDR(this.file.slice(this.bytesRead, this.bytesRead + 4 + 1));
        this.bytesRead += 4;
        return ret_val;
    }

    unpack_pair(){
        let x = this.unpack_double();
        let y = this.unpack_double();
        return [x, y];
    }

    unpack_triple(){
        let x = this.unpack_double();
        let y = this.unpack_double();
        let z = this.unpack_double();
        return [x, y, z];
    }

    unpack_triple_n(num){
        let final_list = [];
        for(let i = 0; i < num; i++){
            final_list.push(this.unpack_triple());
        }
        return final_list;
    }


    unpack_rgb_float(){
        let r = this.unpack_float();
        let g = this.unpack_float();
        let b = this.unpack_float();
        return [r, g, b];
    }
    unpack_rgba_float(){
        let r = this.unpack_float();
        let g = this.unpack_float();
        let b = this.unpack_float();
        let a = this.unpack_float();
        return [r, g, b, a];
    }

    process_beziertriangle(){
        let base_ctlpts = this.unpack_triple_n(10);
        let center_id = this.unpack_unsigned_int();
        let material_id = this.unpack_unsigned_int();
        assert(base_ctlpts.length == 10);
        return new v3dobjects.V3DBezierTriangle(base_ctlpts, material_id, center_id);
    }
    
    process_bezierpatch()
    {
        let base_ctlpts = this.unpack_triple_n(16);
        let center_id = this.unpack_unsigned_int();
        let material_id = this.unpack_unsigned_int();
        assert(base_ctlpts.length == 16);
        return new v3dobjects.V3DBezierPatch(base_ctlpts, material_id, center_id);
    }

    //@todo EOF
    get_obj_type(){
        if(this.bytesRead + 4 <= this.file.length){
        let obj_type =  this.unpack_unsigned_int();
        return obj_type;
        }
        else{
            return null;
        }
    }


    process_header(){
        let header = new v3dobjects.V3DHeaderInformation();
        let num_headers = this.unpack_unsigned_int();
        for(let i = 0; i < num_headers; i++){
            let header_type = this.unpack_unsigned_int();
            let block_count = this.unpack_unsigned_int();

            if(header_type == v3dheadertypes.v3dheadertypes_canvasWidth){
                header.canvasWidth = this.unpack_unsigned_int();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_canvasHeight){
                header.canvasHeight = this.unpack_unsigned_int();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_minBound){
                header.minBound = this.unpack_triple();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_maxBound){
                header.maxBound = this.unpack_triple();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_orthographic){
                header.orthographic = this.unpack_bool();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_angleOfView){
                header.angleOfView = this.unpack_double();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_initialZoom){
                header.initialZoom = this.unpack_double();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_viewportShift){
                header.viewportShift = this.unpack_pair();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_viewportMargin){
                header.viewportMargin = this.unpack_pair();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_light){
                let position = this.unpack_triple();
                let color = this.unpack_rgb_float();
                header.lights.push(new v3dobjects.V3DSingleLightSource(position, color));
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_background){
                header.background = this.unpack_rgba_float();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_absolute){
                // Configuration from now on
                header.configuration.absolute = this.unpack_bool();
            }
            else if(header_type == v3dheadertypes.v3dheadertypes_zoomFactor){
                header.configuration.zoomFactor = this.unpack_double();
            }
            else if(header_type == v3dheadertypes.v3dheadertypes_zoomPinchFactor){
                header.configuration.zoomPinch_factor = this.unpack_double();
            }
            else if(header_type == v3dheadertypes.v3dheadertypes_zoomStep){
                header.configuration.zoomStep = this.unpack_double();
            }
            else if(header_type == v3dheadertypes.v3dheadertypes_shiftHoldDistance){
                header.configuration.shiftHoldDistance = this.unpack_double();
            }
            else if(header_type == v3dheadertypes.v3dheadertypes_shiftWaitTime){
                header.configuration.shiftWaitTime = this.unpack_double();
            }
            else if(header_type == v3dheadertypes.v3dheadertypes_vibrateTime){
                header.configuration.vibrateTime = this.unpack_double();
            }
            else{
                for(let j = 0; j < block_count; j++){
                    this.unpack_unsigned_int();
                }
            }
        }
        return header;
    }

    process_centres(){
        let number_centers = this.unpack_unsigned_int;
        return this.unpack_triple_n(number_centers);
    }

    process_material(){
        let diffuse = this.unpack_rgba_float();
        let emissive = this.unpack_rgba_float();
        let specular = this.unpack_rgba_float();
        //List contains Shininess, metallic and f0
        let result = this.unpack_rgb_float();
        return new v3dobjects.V3DMaterial(diffuse, emissive, specular, result[0], result[1], result[2]);
    }

    get_fn_process_type(typ){
        if(this.object_process_fns(typ) != undefined ){
        //Binding 'this' to the function so that 'this' doesnt get lost
        return this.object_process_fns(typ).bind(this);
        }
        else{
            return null;
        }
    }

    process(force = false){
        if(this.processed && !force){
            return;
        }
        
        if(this.processed && forced){
            xdr.rewind();
        }
        
        this.processed = true;
        this.file_ver = this.unpack_unsigned_int();
        let allow_double_precision = this.unpack_bool();
        
        if(!allow_double_precision){
            this.unpack_double = this.unpack_float.bind(this);
        }

       let type;
        while(type = this.get_obj_type()){
            if(type == v3dtypes.v3dtypes_material){
                this.materials.push(this.process_material());
            }
            else if(type == v3dtypes.v3dtypes_centers){
                this.centeres = this.process_centres();
            }
            else if (type == v3dtypes.v3dtypes_header){
                this.header = this.process_header();
            }
            else{
            let fn = this.get_fn_process_type(type);
            if(fn != null){
               let obj = fn();
                this.objects.push(obj);
            }
            else{
                throw `Unkown Object type ${type}`;
            }
        }
        }
        console.log(` bytes read : ${this.bytesRead} length : ${this.file.length}`);
        //Set the reader to the end of the file
        //this.bytesRead = 0;
    }

    //This is more like from_file_arr 
    static from_file_name(file_name)
    {
        let file = gzip.unzip(file_name);
        let reader_obj = new V3DReader(file);
        return reader_obj;
    }

} 

//get Byte Array from file for gzip
const input = document.querySelector('input[type="file"]');
input.addEventListener('change', function(e){
    let reader = new FileReader();
    reader.readAsArrayBuffer(input.files[0]);
    reader.onloadend = function (evt){
      if(evt.target.readyState == FileReader.DONE){
        let arrayBuffer = evt.target.result;
        let v3dobj = V3DReader.from_file_name(new Uint8Array(arrayBuffer));
        v3dobj.process();
        console.log(v3dobj.objects);
      }
    }
}, false);