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
let xdr = require("js-xdr");
class V3DReader{
    /*
    * @todo add other v3d objects
    */

    constructor(fil){
        this.file = fil;
        this.objects = [];
        this.materials = [];
        this.centeres = [];
        this.header = new v3dobjects.V3DHeaderInformation(); 
        this.file_ver = null;
        this.processed = false;
        this.object_process_fns = {
            v3dtypes_bezierPatch : this.process_bezierpatch,
        };
    }

    unpack_double(){
        return xdr.Double.fromXDR(file);
    }

    unpack_triple(){
        x = unpack_double();
        y = unpack_double();
        z = unpack_double();
        return [x, y, z];
    }
    unpack_triple_n(n){
        final_list = [];
        for(let i = 0; i < n; i++){
            let temp = this.unpack_triple();
            for (let i = 0; i < temp.length(); i++)
            {
                final_list.push(temp[i]);
            }
        }
        return final_list;
    }

    unpack_rgb_float(){
        let r = xdr.Float.fromXDR(this.file);
        let g = xdr.Float.fromXDR(this.file);
        let b = xdr.Float.fromXDR(this.file);
        return [r, g, b];
    }
    unpack_rgba_float(){
        let r = xdr.Float.fromXDR(this.file);
        let g = xdr.Float.fromXDR(this.file);
        let b = xdr.Float.fromXDR(this.file);
        let a = xdr.Float.fromXDR(this.file);
        return [r, g, b, a];
    }

    process_bezierpatch()
    {
        console.log(this.unpack_triple_n(16));
    }

    //Find a way to do EOF 
    get_obj_type(){
        try{
        let obj_type = xdr.UnsignedInt.fromXDR(this.file);
        return obj_type;
        }
        catch(err){
            return null;
        }
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
        if(typ in this.object_process_fns){
        return this.object_process_fns[typ];
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
        this.file_ver = xdr.UnsignedInt.fromXDR(this.file);
        let allow_double_precision = xdr.Bool.fromXDR(this.file);
        
        if(!allow_double_precision){
            this.unpack_double = xdr.Float.fromXDR;
        }

       let type;
       xdr.UnsignedInt.fromXDR(this.file);

        while(type = this.get_obj_type()){
            if(type == v3dtypes.v3dtypes_material){
                this.materials.push(this.process_material());
            }
            else{
            let fn = this.get_fn_process_type(type);
            if(fn != null){
               let obj = new fn();
                this.objects.push(obj);
            }
            else{
                throw `Unkown Object type ${type}`;
            }
        }
        }
        //Set the reader to the end of the file
        //xdr.seek(xdr.Cursor.buffer().length);
    }

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
    reader.onloadend = function (evt)
    {
      if(evt.target.readyState == FileReader.DONE){
        let arrayBuffer = evt.target.result;
        let v3dobj = V3DReader.from_file_name(new Uint8Array(arrayBuffer));
        v3dobj.process();
      }
    }
}, false);



