//TODO: Add other objects

export class AV3DOBJECT{
    constructor(material_id, center_index){
        this.material_id = material_id;
        this.center_index = center_index;
    }
}

export class V3DSingleLightSource{
    constructor(position, color){
        this.position = position;
        this.color = color;
    }
}
export class V3DHeaderInformation{
    constructor(){
        this.canvasWidth = null;
        this.canvasHeight = null;
        this.minBound = null;
        this.maxBound = null;
        this.orthographic = null;
        this.angleOfView = null;
        this.initialZoom = null;
        this.viewportShift = (0.0, 0.0);
        this.viewportMargin = null;
        this.lights = [];
        this.background = (1.0, 1.0, 1.0, 1.0);
        this.configuration = new V3DConfigurationValue();
    }
}

export class V3DBezierPatch extends AV3DOBJECT {
    constructor(ctrl_points, material_id = null, center_index = null){
        super(material_id, center_index);
        this.control_points = ctrl_points;
    }
}

export class V3DConfigurationValue{
    constructor(){
        this.absolute = null;
        this.zoomFactor = null;
        this.zoomPinchFactor = null;
        this.zoomPinchCap = null;
        this.zoomStep = null;
        this.shiftHoldDistance = null;
        this.shiftWaitTime = null;
        this.vibrateTime = null;
    }
}

export class V3DMaterial extends AV3DOBJECT{
    constructor(diffuse, emissive, specular, metallic = 0, shininess = 0.8, f0 = 0.4){
        super();
        this.diffuse = diffuse;
        this.emissive = emissive;
        this.specular = specular;
        this.metallic = metallic;
        this.shininess = shininess;
        this.f0 = f0;
    }
}