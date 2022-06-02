//V3D Reader and Renderer

"use scrict";

//We need to use browserify to
//make the require for the dependancies work
let gzip = require("gzip-js"),
  options = {
    level: 9,
  };
let xdr = require("js-xdr");

//---- Set up ---
let Min = [-310.6061, -201.6304, -2096.144];
let Max = [232.9609, 205.6273, -1194.409];

let Transform = [
  0.1762732, -0.08715096, 0.1482109, 14.37726, 0.1719354, 0.08934971,
  -0.1519502, 4.135837, 2.73381e-17, 0.2122624, 0.1248145, 39.91369,
  3.85186e-34, 3.044927e-18, 1.758601e-18, 1,
];

let webgl2 = false;
let ibl = false;
// ---  Set up done

class V3DReader {
  constructor(fil) {
    //To keep track of how many bytes we have read so we can
    // simulate moving the file reader by making sub arrays
    this.bytesRead = 0;
    this.file = fil;
    this.file_ver = null;
    this.processed = false;
    this.object_process_fns = function (type) {
      switch (type) {
        case v3dtypes.v3dtypes_bezierPatch:
          return this.process_bezierpatch;

        case v3dtypes.v3dtypes_bezierPatchColor:
          return this.process_bezierpatch_color;

        case v3dtypes.v3dtypes_bezierTriangle:
          return this.process_beziertriangle;

        case v3dtypes.v3dtypes_bezierTriangleColor:
          return this.process_beziertriangle_color;

        case v3dtypes.v3dtypes_sphere:
          return this.process_sphere;

        case v3dtypes.v3dtypes_halfSphere:
          return this.process_half_sphere;

        case v3dtypes.v3dtypes_cylinder:
          return this.process_cylinder;

        case v3dtypes.v3dtypes_disk:
          return this.process_disk;

        case v3dtypes.v3dtypes_tube:
          return this.process_tube;

        case v3dtypes.v3dtypes_curve:
          return this.process_beziercurve;

        case v3dtypes.v3dtypes_line:
          return this.process_line;

        case v3dtypes.v3dtypes_pixel:
          return this.process_pixel;

        case v3dtypes.v3dtypes_triangles:
          return this.process_triangles;

        case v3dtypes.v3dtypes_triangle:
          return this.process_straight_beziertriangle;

        case v3dtypes.v3dtypes_triangleColor:
          return this.process_straight_beziertriangle_color;

        case v3dtypes.v3dtypes_quad:
          return this.process_quad;

        case v3dtypes.v3dtypes_quadColor:
          return this.process_quad_color;

        default:
          return undefined;
      }
    };
  }

  // Map [0,1] to [0,255] uniformly, with 0.5 mapping to 128.
  byte(r) {
    if (r < 0.0) r = 0.0;
    let c = Math.floor(r * 256);
    return c < 255 ? c : 255;
  }

  FloatToIntColor(colors) {
    for (let i = 0; i < colors.length; i++) {
      for (let j = 0; j < colors[i].length; j++) {
        colors[i][j] = this.byte(colors[i][j]);
      }
    }
    return colors;
  }

  unpack_bool() {
    let ret_val = xdr.Bool.fromXDR(
      this.file.slice(this.bytesRead, this.bytesRead + 4 + 1)
    );
    this.bytesRead += 4;
    return ret_val;
  }

  unpack_double() {
    let ret_val = xdr.Double.fromXDR(
      this.file.slice(this.bytesRead, this.bytesRead + 8 + 1)
    );
    this.bytesRead += 8;
    return ret_val;
  }

  unpack_float() {
    let ret_val = xdr.Float.fromXDR(
      this.file.slice(this.bytesRead, this.bytesRead + 4 + 1)
    );
    this.bytesRead += 4;
    return ret_val;
  }

  unpack_unsigned_int() {
    let ret_val = xdr.UnsignedInt.fromXDR(
      this.file.slice(this.bytesRead, this.bytesRead + 4 + 1)
    );
    this.bytesRead += 4;
    return ret_val;
  }

  unpack_pair() {
    let x = this.unpack_double();
    let y = this.unpack_double();
    return [x, y];
  }

  unpack_triple() {
    let x = this.unpack_double();
    let y = this.unpack_double();
    let z = this.unpack_double();
    return [x, y, z];
  }

  unpack_triple_n(num) {
    let final_list = [];
    for (let i = 0; i < num; i++) {
      final_list.push(this.unpack_triple());
    }
    return final_list;
  }

  unpack_rgb_float() {
    let r = this.unpack_float();
    let g = this.unpack_float();
    let b = this.unpack_float();
    return [r, g, b];
  }

  unpack_rgba_float() {
    let r = this.unpack_float();
    let g = this.unpack_float();
    let b = this.unpack_float();
    let a = this.unpack_float();
    return [r, g, b, a];
  }

  unpack_rgba_float_n(n) {
    let final_list = [];
    for (let i = 0; i < n; i++) {
      final_list.push(this.unpack_rgba_float());
    }
    return final_list;
  }
  unpack_int_indices() {
    let x = this.unpack_unsigned_int();
    let y = this.unpack_unsigned_int();
    let z = this.unpack_unsigned_int();
    return [x, y, z];
  }

  process_header() {
    let num_headers = this.unpack_unsigned_int();
    for (let i = 0; i < num_headers; i++) {
      let header_type = this.unpack_unsigned_int();
      let block_count = this.unpack_unsigned_int();

      if (header_type == v3dheadertypes.v3dheadertypes_canvasWidth) {
        canvasWidth = this.unpack_unsigned_int();
      } else if (header_type == v3dheadertypes.v3dheadertypes_canvasHeight) {
        canvasHeight = this.unpack_unsigned_int();
      } else if (header_type == v3dheadertypes.v3dheadertypes_minBound) {
        Min = minBound = this.unpack_triple(); //TODO fix Min
      } else if (header_type == v3dheadertypes.v3dheadertypes_maxBound) {
        Max = maxBound = this.unpack_triple(); //TODO fix Max
      } else if (header_type == v3dheadertypes.v3dheadertypes_orthographic) {
        orthographic = this.unpack_bool();
      } else if (header_type == v3dheadertypes.v3dheadertypes_angleOfView) {
        angleOfView = this.unpack_double();
      } else if (header_type == v3dheadertypes.v3dheadertypes_initialZoom) {
        initialZoom = this.unpack_double();
      } else if (header_type == v3dheadertypes.v3dheadertypes_viewportShift) {
        viewportShift = this.unpack_pair();
      } else if (header_type == v3dheadertypes.v3dheadertypes_viewportMargin) {
        viewportMargin = this.unpack_pair();
      } else if (header_type == v3dheadertypes.v3dheadertypes_light) {
        let position = this.unpack_triple();
        let color = this.unpack_rgb_float();
        //TODO: Does color use int or floats here?
        Lights.push(new Light(position, color));
      } else if (header_type == v3dheadertypes.v3dheadertypes_background) {
        Background = this.unpack_rgba_float();
      } else if (header_type == v3dheadertypes.v3dheadertypes_absolute) {
        // Configuration from now on
        absolute = this.unpack_bool();
      } else if (header_type == v3dheadertypes.v3dheadertypes_zoomFactor) {
        zoomFactor = this.unpack_double();
      } else if (header_type == v3dheadertypes.v3dheadertypes_zoomPinchFactor) {
        zoomPinchFactor = this.unpack_double();
      } else if (header_type == v3dheadertypes.v3dheadertypes_zoomStep) {
        zoomStep = this.unpack_double();
      } else if (
        header_type == v3dheadertypes.v3dheadertypes_shiftHoldDistance
      ) {
        shiftHoldDistance = this.unpack_double();
      } else if (header_type == v3dheadertypes.v3dheadertypes_shiftWaitTime) {
        shiftWaitTime = this.unpack_double();
      } else if (header_type == v3dheadertypes.v3dheadertypes_vibrateTime) {
        vibrateTime = this.unpack_double();
      } else {
        for (let j = 0; j < block_count; j++) {
          this.unpack_unsigned_int();
        }
      }
    }
  }

  process_bezierpatch() {
    let controlpoints = this.unpack_triple_n(16);
    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();
    P.push(
      new BezierPatch(controlpoints, CenterIndex, MaterialIndex, Min, Max)
    );
  }

  process_bezierpatch_color() {
    let controlpoints = this.unpack_triple_n(16);

    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();

    let colors = this.unpack_rgba_float_n(4);
    colors = this.FloatToIntColor(colors);
    P.push(
      new BezierPatch(
        controlpoints,
        CenterIndex,
        MaterialIndex,
        Min,
        Max,
        colors
      )
    );
  }

  process_beziertriangle() {
    let controlpoints = this.unpack_triple_n(10);
    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();
    P.push(
      new BezierPatch(controlpoints, CenterIndex, MaterialIndex, Min, Max)
    );
  }

  process_beziertriangle_color() {
    let controlpoints = this.unpack_triple_n(10);
    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();
    let colors = this.unpack_rgba_float_n(3);
    colors = this.FloatToIntColor(colors);

    P.push(
      new BezierPatch(
        controlpoints,
        CenterIndex,
        MaterialIndex,
        Min,
        Max,
        colors
      )
    );
  }

  process_straight_beziertriangle() {
    let controlpoints = this.unpack_triple_n(3);
    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();

    P.push(
      new BezierPatch(controlpoints, CenterIndex, MaterialIndex, Min, Max)
    );
  }

  process_straight_beziertriangle_color() {
    let controlpoints = this.unpack_triple_n(3);
    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();
    let colors = this.unpack_rgba_float_n(3);
    colors = this.FloatToIntColor(colors);
    P.push(
      new BezierPatch(
        controlpoints,
        CenterIndex,
        MaterialIndex,
        Min,
        Max,
        colors
      )
    );
  }

  process_sphere() {
    let center = this.unpack_triple();
    let radius = this.unpack_double();

    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();
    sphere(center, radius, CenterIndex, MaterialIndex);
  }

  process_half_sphere() {
    let center = this.unpack_triple();
    let radius = this.unpack_double();

    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();

    let polar = this.unpack_double();
    let azimuth = this.unpack_double();
    let dir = [polar, azimuth];
    sphere(center, radius, CenterIndex, MaterialIndex, dir);
  }

  process_cylinder() {
    let center = this.unpack_triple();
    let radius = this.unpack_double();
    let height = this.unpack_double();

    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();

    let polar = this.unpack_double();
    let azimuth = this.unpack_double();
    let coreBase = this.unpack_bool();
    let dir = [polar, azimuth];
    cylinder(center, radius, height, CenterIndex, MaterialIndex, dir, coreBase);
  }

  process_disk() {
    let center = this.unpack_triple();
    let radius = this.unpack_double();

    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();

    let polar = this.unpack_double();
    let azimuth = this.unpack_double();
    let dir = [polar, azimuth];
    disk(center, radius, CenterIndex, MaterialIndex, dir);
  }

  process_tube() {
    let points = this.unpack_triple_n(4);
    let width = this.unpack_double();

    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();

    let coreBase = this.unpack_bool();
    tube(points, width, CenterIndex, MaterialIndex, Min, Max, coreBase);
  }

  process_beziercurve() {
    let controlpoints = this.unpack_triple_n(4);
    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();
    P.push(
      new BezierCurve(controlpoints, CenterIndex, MaterialIndex, Min, Max)
    );
  }

  process_line() {
    let controlpoints = this.unpack_triple_n(2);
    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();
    P.push(
      new BezierCurve(controlpoints, CenterIndex, MaterialIndex, Min, Max)
    );
  }

  process_pixel() {
    let controlpoint = this.unpack_triple();
    let width = this.unpack_double();
    let MaterialIndex = this.unpack_unsigned_int();
    P.push(new Pixel(controlpoint, width, MaterialIndex, Min, Max));
  }

  process_material() {
    let diffuse = this.unpack_rgba_float();
    let emissive = this.unpack_rgba_float();
    let specular = this.unpack_rgba_float();
    let result = this.unpack_rgb_float();
    let shininess = result[0];
    let metallic = result[1];
    let fresnel0 = result[2];
    Materials.push(
      new Material(diffuse, emissive, specular, shininess, metallic, fresnel0)
    );
  }

  process_centers() {
    let number_centers = this.unpack_unsigned_int();
    Centers = this.unpack_triple_n(number_centers);
  }

  process_triangles() {
    let colors = null;
    let explicitCi = null;
    let isColor = false;
    let numIndex = this.unpack_unsigned_int();

    let numPositions = this.unpack_unsigned_int();
    let positions = this.unpack_triple_n(numPositions);

    let numNormals = this.unpack_unsigned_int();
    let normals = this.unpack_triple_n(numNormals);

    let explicitNI = this.unpack_bool();

    let numColor = this.unpack_unsigned_int();

    if (numColor > 0) {
      isColor = true;
      colors = this.unpack_rgba_float_n(numColor);
      explicitCi = this.unpack_bool();
    }

    let posIndices = [];
    let normalIndices = [];
    let colorIndices = null;

    if (isColor) {
      colorIndices = [];
    }

    for (let i = 0; i < numIndex; i++) {
      let posIndex = this.unpack_int_indices();
      let normalIndex = explicitNI ? this.unpack_int_indices() : posIndex;
      let colorIndex = null;

      if (isColor) {
        colorIndex = explicitCi ? this.unpack_int_indices() : posIndex;
        colorIndices.push(colorIndex);
      }

      posIndices.push(posIndex);
      normalIndices.push(normalIndex);
    }

    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();

    for (let i = 0; i < positions.length; i++) {
      Positions.push(positions[i]);
    }

    for (let i = 0; i < normals.length; i++) {
      Normals.push(normals[i]);
    }

    if (isColor) {
      for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < colors[i].length; j++) {
          colors[i][j] = this.byte(colors[i][j]);
        }
        Colors.push(colors[i]);
      }
    }

    for (let i = 0; i < posIndices.length; i++) {
      if (isColor) {
        Indices.push([posIndices[i], normalIndices[i], colorIndices[i]]);
      } else {
        Indices.push([posIndices[i], normalIndices[i]]);
      }
    }

    triangles(CenterIndex, MaterialIndex, Min, Max);
  }

  process_quad() {
    let vertices = this.unpack_triple_n(4);
    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();
    P.push(new BezierPatch(vertices, CenterIndex, MaterialIndex, Min, Max));
  }

  process_quad_color() {
    let vertices = this.unpack_triple_n(4);
    let CenterIndex = this.unpack_unsigned_int();
    let MaterialIndex = this.unpack_unsigned_int();

    let colors = this.unpack_rgba_float_n(4);
    colors = this.FloatToIntColor(colors);
    P.push(
      new BezierPatch(vertices, CenterIndex, MaterialIndex, Min, Max, colors)
    );
  }

  get_obj_type() {
    if (this.bytesRead + 4 <= this.file.length) {
      let obj_type = this.unpack_unsigned_int();
      return obj_type;
    } else {
      return null;
    }
  }

  get_fn_process_type(typ) {
    if (this.object_process_fns(typ) != undefined) {
      //We need to bind the current V3Dreader object to
      //the function so that it knows what to refer to
      //When it calls 'this'
      return this.object_process_fns(typ).bind(this);
    } else {
      return null;
    }
  }

  process(force = false) {
    if (this.processed && !force) {
      return;
    }

    if (this.processed && forced) {
      this.bytesRead = 0;
    }

    this.processed = true;
    this.file_ver = this.unpack_unsigned_int();
    let allow_double_precision = this.unpack_bool();

    if (!allow_double_precision) {
      this.unpack_double = this.unpack_float.bind(this);
    }

    let type;
    while ((type = this.get_obj_type())) {
      if (type == v3dtypes.v3dtypes_material) {
        this.materials.push(this.process_material());
      } else if (type == v3dtypes.v3dtypes_centers) {
        this.process_centers();
      } else if (type == v3dtypes.v3dtypes_header) {
        this.header = this.process_header();
      } else {
        let fn = this.get_fn_process_type(type);
        if (fn != null) {
          let obj = fn();
          this.objects.push(obj);
        } else {
          alert(`Unkown Object type ${type}`);
        }
      }
    }
    if (this.bytesRead != this.file.length) {
      throw "All bytes in V3D file not read";
    }
  }

  static from_file_arr(file_name) {
    let file = gzip.unzip(file_name);
    let reader_obj = new V3DReader(file);
    return reader_obj;
  }
}

function load_asy_gl() {
  return new Promise(function (resolve, reject) {
    let asy_gl = document.createElement("script");
    asy_gl.type = "text/javascript";

    asy_gl.src = "https://www.math.ualberta.ca/~bowman/asygl.js";

    asy_gl.onload = function () {
      resolve();
    };

    asy_gl.onerror = function () {
      reject(new Error("Could not load the asy_gl library"));
    };

    document.head.appendChild(asy_gl);
  });
}

//Wait for asy_gl before reading in document
let promise = load_asy_gl();

promise.then(
  function () {
    const input = document.querySelector('input[type="file"]');
    input.addEventListener(
      "change",
      function (e) {
        let reader = new FileReader();
        reader.readAsArrayBuffer(input.files[0]);
        reader.onloadend = function (evt) {
          if (evt.target.readyState == FileReader.DONE) {
            //get Byte Array from file for gzip
            let arrayBuffer = evt.target.result;
            let v3dobj = V3DReader.from_file_arr(new Uint8Array(arrayBuffer));
            v3dobj.process();
            webGLStart();
          }
        };
      },
      false
    );
  },

  function (error) {
    alert(error);
  }
);
