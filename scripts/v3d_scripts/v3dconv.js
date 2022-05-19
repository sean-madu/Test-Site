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
let Min = [-310.6061,-201.6304,-2096.144];
let Max = [232.9609,205.6273,-1194.409];

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
        let controlpoints = this.unpack_triple_n(10);
        let CenterIndex = this.unpack_unsigned_int();
        let MaterialIndex = this.unpack_unsigned_int();
        assert(controlpoints.length == 10);
        P.push(new BezierPatch(controlpoints, CenterIndex, MaterialIndex, Min, Max));
        return new v3dobjects.V3DBezierTriangle(controlpoints, MaterialIndex, CenterIndex);
    }
    
    process_bezierpatch()
    {
        let controlpoints = this.unpack_triple_n(16);
        let CenterIndex = this.unpack_unsigned_int();
        let MaterialIndex = this.unpack_unsigned_int();
        //TODO Fix me
        //let Min=[-310.6061,-201.6304,-2096.144];
        //let Max=[232.9609,205.6273,-1194.409]; 
        //let color = null;

        assert(controlpoints.length == 16);

        P.push(new BezierPatch(controlpoints,CenterIndex,MaterialIndex,Min,Max));
        
        return new v3dobjects.V3DBezierPatch(controlpoints, MaterialIndex, CenterIndex);
    }


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
                canvasWidth = header.canvasWidth = this.unpack_unsigned_int();
                
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_canvasHeight){
                canvasHeight = header.canvasHeight = this.unpack_unsigned_int();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_minBound){
                minBound = header.minBound = this.unpack_triple();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_maxBound){
                maxBound = header.maxBound = this.unpack_triple();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_orthographic){
               orthographic = header.orthographic = this.unpack_bool();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_angleOfView){
               angleOfView =  header.angleOfView = this.unpack_double();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_initialZoom){
               initialZoom =  header.initialZoom = this.unpack_double();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_viewportShift){
               viewportShift =  header.viewportShift = this.unpack_pair();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_viewportMargin){
                viewportMargin = header.viewportMargin = this.unpack_pair();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_light){
                let position = this.unpack_triple();
                let color = this.unpack_rgb_float();
                header.lights.push(new v3dobjects.V3DSingleLightSource(position, color));
                //TODO Fix so we can muliple lights
                Lights=[new Light(position,color),]; 
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_background){
                   Background =  header.background = this.unpack_rgba_float();
            }
            else if (header_type == v3dheadertypes.v3dheadertypes_absolute){
                // Configuration from now on
               absolute = header.configuration.absolute = this.unpack_bool();
            }
            else if(header_type == v3dheadertypes.v3dheadertypes_zoomFactor){
               zoomFactor = header.configuration.zoomFactor = this.unpack_double();
            }
            else if(header_type == v3dheadertypes.v3dheadertypes_zoomPinchFactor){
               zoomPinchFactor = header.configuration.zoomPinch_factor = this.unpack_double();
            }
            else if(header_type == v3dheadertypes.v3dheadertypes_zoomStep){
               zoomStep =  header.configuration.zoomStep = this.unpack_double();
            }
            else if(header_type == v3dheadertypes.v3dheadertypes_shiftHoldDistance){
                 shiftHoldDistance = header.configuration.shiftHoldDistance = this.unpack_double();
            }
            else if(header_type == v3dheadertypes.v3dheadertypes_shiftWaitTime){
               shiftWaitTime =  header.configuration.shiftWaitTime = this.unpack_double();
            }
            else if(header_type == v3dheadertypes.v3dheadertypes_vibrateTime){
               vibrateTime = header.configuration.vibrateTime = this.unpack_double();
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
        let result = this.unpack_rgb_float();
        let shininess = result[0];
        let metallic = result[1];
        let fresnel0 = result[2];
        Materials.push(new Material(diffuse,emissive,specular,shininess,metallic,
            fresnel0));
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
            this.bytesRead = 0;
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
        if(this.bytesRead != this.file.length){
            throw 'All bytes in V3D file not read';
        }
    }

    //This is more like from_file_arr 
    static from_file_name(file_name)
    {
        let file = gzip.unzip(file_name);
        let reader_obj = new V3DReader(file);
        return reader_obj;
    }
} 

//Load in asy_gl
let asy_gl =  document.createElement("script");
asy_gl.type = 'text/javascript';

asy_gl.src = "https://www.math.ualberta.ca/~bowman/asygl.js";

asy_gl.onload = function(){
    console.log(Nmaterials);
}

document.head.appendChild(asy_gl);
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
        webGLStart();
      }
    }




}, false);