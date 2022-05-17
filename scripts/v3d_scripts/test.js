
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
              for(let i = 0; i < block_count; i++){
                  this.unpack_unsigned_int;
              }
          }