//! XNWebglGlobal.js
//！ 仙女座threejs地球可视化
//! https://github.com/fanaiai/xnwebglglobal
//! version : 1.0.0
//! authors : 范媛媛
//! create date:2021/03/10
//! update date:2021/03/10 v1.0.0发布
import './xnquery.js'
import './xnwebglmap.css'
import * as THREE from './three/three.module.js'
import {OrbitControls} from './three/OrbitControls.js';
// import {TransformControls} from './three/TransformControls.js';
import {CSS2DRenderer, CSS2DObject} from './three/CSS2DRenderer.js';
import lerp from '@sunify/lerp-color'
// import * as d3geo from 'd3-geo'
(function (window, $) {
    // var that;
    var option = {
        backgroundColor: '#000000',
        backgroundOpacity: 1,
        type: 'area',//hot,fly
        baseGlobal: {
            color: '#000000',
            opacity: 1,
            countryPolygonType: 'grid',//grid,area
            gridSize: 2,
            gridStep: 2,
            gridColor: '#00ccc2',
            areaColor: '#071c1c',
            areaLine: '#00ccc2',
            showLine: false,
            showArea: true,
            hoverColor: '#ffffff',//鼠标移动至区域时的颜色
            texture: {
                show: false,
                img: ''
            },
            "areaOpacity": 1,
            "areaLineOpacity": 1,
            "gridOpacity": 1,
            "resize":0.7
        },
        tooltip: {
            "show": true,
            "content": "",
            "backgroundColor": "rgba(8,85,139,.8)",
            "backgroundImage": "",
            "backgroundSize": "",
            "borderColor": "#00B4FF",
            "color": "#fff",
            "borderRadius": 4,
            "borderWidth": 1,
            "fontSize": 12,
            "borderStyle": "solid",
            "padding": 4,
        },
        "label": {
            "wordAvoidance": true,
            "showAllLabel": true,
            "start": {
                "hideLabel": false,//false,或范围，按照数据从小到大排序
                "labelScope": [1, 5],
                "sort": "desc",
                "col": "D",
                "backgroundColor": "rgba(8,85,139,.8)",
                "backgroundImage": "",
                "backgroundSize": "",
                "borderColor": "#00B4FF",
                "color": "#fff",
                "borderRadius": 4,
                "borderWidth": 1,
                "show": true,
                "fontSize": 12,
                "borderStyle": "solid",
                "padding": 4,
                "content": "",
            },
            "end": {
                "backgroundColor": "rgba(8,85,139,.8)",
                "backgroundImage": "",
                "backgroundSize": "",
                "borderColor": "#00B4FF",
                "color": "#fff",
                "borderRadius": 4,
                "borderWidth": 1,
                "show": true,
                "fontSize": 12,
                "borderStyle": "solid",
                "padding": 4,
                "content": "<p class=\"paragraph\" style='padding:4px 6px'><span class=\"bi-label-field\" data-key=\"ZKUNNR_ZLANDX\" contenteditable=\"false\">money</span> <span class=\"bi-label-field\" data-key=\"money$$_sum\" contenteditable=\"false\">money</span>元<br></p>"
            },
        },
        lightSphere: {
            show: true,
            color: '#048989',
            opacity: 2
        },
        attr: {
            area: {
                colors: ['#ffff00', '#ffcc00', '#ff0000', '#cc0000'],
            },
            hot: {
                type: {
                    'circleLight': {
                        show: true,
                        width: .12,
                    },
                    'lightBar': {
                        show: true,
                        width: .12
                    },
                    'bar': {
                        show: false,
                        segments: 4,
                        radiusTop: 4,
                        radiusBottom: 4
                    },
                    'wave': {
                        show: true,
                        width: .22,
                    },
                    'cone': {
                        show: false,
                        height: 1 / 16,
                        ratio: 3,
                        segments: 4,
                    }
                },//都添加什么元素
                colors: ['#2c8ad7', '#3bd5ac', '#d5860c'],
            },
            fly: {
                type: {
                    'circleLight': {
                        show: true,
                        width: .12,
                    },
                    'lightBar': {
                        show: true,
                        width: .12
                    },
                    'bar': {
                        show: false,
                        segments: '4',
                        radiusTop: 2,
                        radiusBottom: 2
                    },
                    'wave': {
                        show: true,
                        width: .22,
                    },
                    'flyLine': {
                        show: true,
                        color: '#00ccc2',
                        width: 2,
                        lineType: 'Basic',//Dashed
                        dashSize: 3,
                        gapSize: 1
                    },
                    'flyPoint': {
                        show: true,
                        color: '#ffaa00',
                        len: .2,
                        pointSize: 6
                    },
                    'cone': {
                        show: true,
                        height: 1 / 16,
                        ratio: 3,
                        segments: 4,
                    }
                },//都添加什么元素
                colors: ['#00ccc2', '#ffff4a',],
            }
        },
        animate: {
            open: true,
            rotateStep: 0.002
        },
    }

    function XNWebglMap(dom, options, mapData) {
        // this.projection = d3geo.geoMercator().center([104.0, 37.5]).scale(80).translate([0, 0]);
        this.dom = dom;
        this.dom.innerHTML = ''
        this.mapData = mapData;
        this.legendData = {};
        dom.classList.add("xnmap-container");
        this.id = this.getRandomString();
        dom.setAttribute('data-id', this.id);
        this.option = $.extend(true, {}, option, options);
        this.option.width = this.dom.offsetWidth;
        this.option.height = this.dom.offsetHeight;
        this.labelArry = [];
        this.chooseMesh = null;
        this.calcMeshArry = [];
        this.mouseoverearth = false;
        this.setLabelRender();
        this.initThree();
        this.addControl();
        this['add' + this.option.type]()
        this.eventList = {}
        this.tooltip = this.addtooltip();
        // this.scene.add(this.tooltip);
        this.initLegendData();
        this.addLegendEvent();
        this.addEvent();
    }

    XNWebglMap.prototype = {
        setLegend(legend, field,colors) {
            if (legend) {
                let {min, max} = this._getMaxMinFunc(this.option.data, field);
                this.legendData[field] = {
                    min: min,
                    max: max,
                    curmin: min,
                    curmax: max,
                    colors: colors,
                    attr:legend
                }
            }
        },
        initLegendData() {
            if(!this.option.data || this.option.data.length<=0){
                return;
            }
            if (this.option.layer && this.option.layer.length > 0) {
                for (let i = 0; i < this.option.layer.length; i++) {
                    let field = this.option.layer[i].col;
                    let legend = this.option.layer[i].legend;
                    if(!legend.show){
                        continue;
                    }
                    let colors=this.option.layer[i].colors;
                    if(this.option.layer[i].type.area.show){
                        colors=this.option.layer[i].type.area.colors
                    }
                    this.setLegend(legend, field,colors);
                }
            } else {
                if(this.option.legend.show){
                    this.setLegend(this.option.legend, this.option.valueName,this.option.attr[this.option.type].colors);
                }
            }
            let key=0;
            for (let i in this.legendData) {
                this.addLegendDom(i,key);
                key++;
            }
        },
        addLegendDom(id,key) {
            let legend = this.legendData[id]
            let background = $.extend(true, [], legend.colors).reverse().join(",")
            let dom = `<div class="xnwebglobal-legend" data-legendkey="${id}" style="left:${key * 100+30}px;color:${this.option.legend.color}">
    <p class="max-text">高</p>
    <div class="legend-bar">
        <div class="color-bar" style="background:linear-gradient(${background})"></div>
        <div class="max-bar ope-bar">
            <div class="bar" data-key="max"></div>
            <p>${legend.max}</p>
        </div>
        <div class="min-bar ope-bar">
            <div class="bar" data-key="min"></div>
            <p>${legend.min}</p>
        </div>
    </div>
    <p class="min-text">低</p>
</div>`
            $(this.dom).append(dom);
        },
        addLegendEvent() {
            let down = false;
            let ele = {}
            this.dom.addEventListener('mousedown', (e) => {
                let $t = $(e.target);
                if ($t.hasClass("bar")) {
                    down = true;
                    ele.key = $t.attr("data-key");
                    ele.id = $t.parents(".xnwebglobal-legend").attr("data-legendkey")
                    ele.$colorBar = $t.parents(".xnwebglobal-legend").find(".legend-bar")
                    ele.$dom = $t.parent();
                    ele.bar = $t.attr("data-key");
                    ele.height = ele.$colorBar.get(0).getBoundingClientRect().height;
                    ele.$legendDom = $t.parents(".xnwebglobal-legend");
                }
            })
            document.addEventListener('mousemove', (e) => {
                let $t = $(e.target);
                if (down) {
                    let legend = this.legendData[ele.id]
                    var top = e.clientY - ele.$colorBar.get(0).getBoundingClientRect().top;
                    if (top < 0) {
                        top = 0;
                    }
                    if (top > ele.height) {
                        top = ele.height;
                    }
                    let value = (legend.max - legend.min) * (ele.height - top) / ele.height + legend.min;
                    if(legend.max>10){
                        value=parseInt(value);
                    }
                    else{//10以内的数，最多保留2位小数
                        value=Math.round(value * 100) / 100
                    }
                    if(top==0){
                        value=legend.max;
                    }
                    if(top==ele.height){
                        value=legend.min;
                    }
                    legend['cur' + ele.bar] = value;
                    let otherbar = ele.bar == 'min' ? 'max' : 'min';
                    var equal = false;
                    if (ele.bar == 'min') {
                        if (value > legend.curmax) {
                            equal = true;
                        }
                    }
                    if (ele.bar == 'max') {
                        if (value < legend.curmin) {
                            equal = true;
                        }
                    }
                    if (equal) {
                        legend['cur' + otherbar] = value;
                        ele.$legendDom.find('.' + otherbar + '-bar').css('top', top + 'px');
                        ele.$legendDom.find('.' + otherbar + '-bar').find('p').html(value);
                    }
                    ele.$dom.css("top", top + 'px')
                    ele.$dom.find('p').get(0).innerHTML=(value);
                    this.updateItemsVisible(ele.id, legend);
                }
            })
            document.addEventListener('mouseup', (e) => {
                let $t = $(e.target);
                down = false;
            })
        },
        updateItemsVisible(id, legend) {
            this.hotDataMesh.children.forEach(e => {
                let v = e.origindata[id]
                e.origindata.$$_hide=false;
                e.visible = true;
                if (v < legend.curmin || v > legend.curmax) {
                    e.visible = false;
                    e.origindata.$$_hide=true;
                }
            })
            this.areaGroup.forEach(e => {
                let v = e.origindata[id]
                e.origindata.$$_hide=false;
                if (v < legend.curmin || v > legend.curmax) {
                    e.origindata.$$_hide=true;
                    e.material.color.set(this.option.baseGlobal[this.option.baseGlobal.countryPolygonType + 'Color']);
                    // e.color = e.material.color.clone();//自定义颜色属性 用于射线拾取交互
                }
                else{
                    e.material.color.set(e.color);
                }
            })
            this.updateLabelPos();
        },
        _checkLegend(data) {
            let r = true;
            for (let i in this.legendData) {
                if (data[i] < this.legendData[i].curmin && data[i] > this.legendData[i].curmax) {
                    r = false;
                    break;
                }
            }
            return r;
        },

        addarea(isNotArea, callback) {
            this.map = new THREE.Group();
            this.boxGroup = new THREE.Group();
            this.areaGroup = [];
            this.scene.add(this.map)
            this.getMapData((data) => {
                var dataColor = !isNotArea ? this.calcAreaCountryColor(this.option.data) : null;
                data.features.forEach(item => {
                    if (item.geometry.type == 'Polygon') {
                        item.geometry.coordinates = [item.geometry.coordinates]
                        item.geometry.type = 'MultiPolygon';
                    }
                    if (!item.properties.nameZh) {
                        item.properties.nameZh = item.properties.name
                    }
                    // if(item.properties.nameZh=='海南省'){
                    //     this.translateHN(item);
                    // }
                    var line = this.countryLine1(item.geometry.coordinates);//国家边界
                    this.boxGroup.add(line)

                })
                this.map.add(this.boxGroup);//国家边界集合插入earth中
                this.centerCamera(this.map, this.camera)
                data.features.forEach(item => {
                    if (item.geometry.type == 'Polygon') {
                        // item.geometry.coordinates = [item.geometry.coordinates]
                        // console.log(item.geometry.coordinates)
                    }
                    let mesh = this.countryMesh(item.geometry.coordinates);//国家边界
                    // mesh.material.color.set(dataColor[item.properties.nameZh])
                    mesh.name = item.properties.nameZh;//设置每个国家mesh对应的中文名
                    mesh.meshType = 'area'
                    // mesh.geometry.parameters.options.depth=100;
                    // console.log(mesh.geometry.parameters.options.depth)
                    this.calcMeshArry.push(mesh)
                    if (!isNotArea) {
                        if (dataColor[mesh.name]) {//worldZh.json部分国家或地区在gdp.json文件中不存在，判断下，以免报错
                            mesh.material.color.copy(dataColor[mesh.name].color);
                            mesh.color = dataColor[mesh.name].color;//自定义颜色属性 用于射线拾取交互
                            mesh.origindata = dataColor[mesh.name].origindata;//自定义颜色属性 用于射线拾取HTML标签显示
                            this.areaGroup.push(mesh)
                        } else {
                            mesh.material.color.set(this.option.baseGlobal[this.option.baseGlobal.countryPolygonType + 'Color']);
                            mesh.color = mesh.material.color.clone();//自定义颜色属性 用于射线拾取交互
                        }
                    } else {//hot 或 fly
                        mesh.material.color.set(this.option.baseGlobal[this.option.baseGlobal.countryPolygonType + 'Color']);
                        mesh.color = mesh.material.color.clone();//自定义颜色属性 用于射线拾取交互
                        if (this.option.layer && this.option.layer.length > 0 && this.option.type == 'hot') {
                            for (let i = 0; i < this.option.layer.length; i++) {
                                let attr = this.option.layer[i];
                                mesh.material.color.set(this.option.baseGlobal[this.option.baseGlobal.countryPolygonType + 'Color']);
                                mesh.color = mesh.material.color.clone();//自定义颜色属性 用于射线拾取交互
                                if (!this.option.data[0] || this.option.data[0][attr.col] == undefined) {
                                    continue;
                                }
                                if (attr.type.area.show) {
                                    let dataColor = this.calcAreaCountryColor(this.option.data, attr.col, attr.type.area);
                                    if (dataColor[mesh.name]) {//worldZh.json部分国家或地区在gdp.json文件中不存在，判断下，以免报错
                                        mesh.material.color.copy(dataColor[mesh.name].color);
                                        mesh.color = dataColor[mesh.name].color;//自定义颜色属性 用于射线拾取交互
                                        mesh.origindata = dataColor[mesh.name].origindata;//自定义颜色属性 用于射线拾取HTML标签显示
                                        this.areaGroup.push(mesh)
                                    }
                                }
                            }
                        }
                    }

                    this.map.add(mesh)
                })
                let backLine = this.boxGroup.clone();
                backLine.position.z = 0;
                this.map.add(backLine)
                this.boxGroup.position.z = this.mapSize * parseFloat(this.option.baseGlobal.depth*0.1) * 1.05;
                if(this.option.baseGlobal.depth<=0){
                    this.boxGroup.position.z = this.mapSize * 0.001;
                }
                if (typeof callback == 'function') {
                    callback()
                }
                setTimeout(() => {
                    this.updateLabelPos();
                }, 500)

            })
        },
        countryLine1(arry) {
            var group = new THREE.Group();
            arry.forEach(area => {
                let positionArry = [];
                var geometry = new THREE.BufferGeometry();
                var material = new THREE.MeshBasicMaterial({
                    color: this.option.baseGlobal.areaLine
                });
                var mesh = new THREE.Line(geometry, material);
                area.forEach(a => {
                    a.forEach(points => {
                        var coord = this.lonLat2Mercator(points[0], points[1])
                        positionArry.push(coord.x, coord.y, 0);
                    })
                })
                geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positionArry), 3))
                group.add(mesh);
            })
            return group;
        },
        countryMesh(polygonArr) {
            var shapeArr = [];//轮廓形状Shape集合
            polygonArr.forEach(pointsArr => {
                var vector2Arr = [];
                // 转化为Vector2构成的顶点数组
                pointsArr[0].forEach(elem => {
                    var coord = this.lonLat2Mercator(elem[0], elem[1])
                    vector2Arr.push(new THREE.Vector2(coord.x, coord.y))
                });
                var shape = new THREE.Shape(vector2Arr);
                shapeArr.push(shape);
            });
            var material = new THREE.MeshLambertMaterial({
                color: 0x004444,
                side: THREE.DoubleSide, //两面可见
            }); //材质对象
            var extrudeSettings = {
                depth: this.mapSize * parseFloat(this.option.baseGlobal.depth*0.1), //拉伸长度
                // depth:10,
                bevelEnabled: false //无倒角
            };
            // console.log(extrudeSettings)
            var geometry = new THREE.ExtrudeBufferGeometry(shapeArr, extrudeSettings);
            // var geometry=new THREE.BufferGeometry(shapeArr)
            var mesh = new THREE.Mesh(geometry, material); //网格模型对象
            return mesh;
        },
        translateHN(E,N){
            let min=[105.9,26.3];
            let max=[123.5,1.42];
            if(E>=min[0] && E<=max[0] && N>=max[1] && N<=min[1]){
                E+=140;
                N-=10;
                E=min[0]+(E-min[0])/6;
                N=min[1]+(N-min[1])/6;
            }
            return [E,N];
        },
        lonLat2Mercator(E, N) {
            // var x = ((E / 360) + 0.5) * this.option.width;
            // var y = ( ((N / 180) + 0.5)) * this.option.height;
            // [E,N]=this.translateHN(E,N)
            var x = ((E / 360) + 0.5)*1.5;
            var y = ( ((N / 180) + 0.5))*1;
            // x=E;
            // y=Math.log(Math.tan(Math.PI / 4 + N/ 2));
            // var x=parseFloat(N)/360
            // var y=(-180/Math.PI*Math.log(Math.tan(Math.PI/4+parseFloat(E)*Math.PI/360)))/360;
            return {
                x: x, //墨卡托x坐标——对应经度
                y: y, //墨卡托y坐标——对应维度
                z: 0
            }
            // var [x,y]=this.projection([E,N])
            // return {
            //     x: x, //墨卡托x坐标——对应经度
            //     y: y, //墨卡托y坐标——对应维度
            //     z: 0
            // }
            // return {
            //     x: E, //墨卡托x坐标——对应经度
            //     y: N, //墨卡托y坐标——对应维度
            //     z: 0
            // }
            // var n = 1;
            // n=25858105;
            // // n=6858538;
            // var x = parseFloat(E) * n / 180;
            // var y = Math.log(Math.tan((90 + parseFloat(N)) * Math.PI / 360)) / (Math.PI / 180);
            // y = y * n / 180;
            // return {
            //     x: x, //墨卡托x坐标——对应经度
            //     y: y, //墨卡托y坐标——对应维度
            //     z: 0
            // }
        },
        getMapData(callback) {
            if (this.mapData) {
                callback(this.mapData)
                return;
            }
            var loader = new THREE.FileLoader()
            loader.setResponseType('json')
            loader.load(staticpath + '/static/chinahn.json', (data) => {
                if (typeof callback == 'function') {
                    callback(data)
                }
            })
        },
        getRandomString(len) {
            len = len || 8;
            var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz';
            /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
            var maxPos = $chars.length;
            var pwd = '';
            for (let i = 0; i < len; i++) {
                pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
            }
            return pwd;
        },
        addLabel(position, data, content) {
            if (!this.option.label[content].show) {
                return;
            }
            var div = document.createElement('div');
            div.classList.add('xnmap-label')
            var worldVector = new THREE.Vector3(
                position.x - this.center.x,
                position.y - this.center.y,
                position.z - this.center.z//墨卡托中心偏移
            );
            var standardVector = worldVector.project(this.camera);//世界坐标转标准设备坐标
            var a = this.option.width / 2;
            var b = this.option.height / 2;
            var x = Math.round(standardVector.x * a + a);//标准设备坐标转屏幕坐标
            var y = Math.round(-standardVector.y * b + b);//标准设备坐标转屏幕坐标
            /**
             * 更新立方体元素位置
             */
            div.style.left = x + 'px';
            div.style.top = y + 'px';
            this._setLabelStyle(div, this.option.label[content]);
            // var coor=this.lon2xyz(this.option.R*1.01,lon,lat);
            div.style.display = 'none'//初始化的时候设置none
            div.innerHTML = this.calcTextLabel(this.option.label[content].content, data);
            this.dom.appendChild(div)
            this.labelArry.push({
                dom: div,
                position: position,
                x: x,
                y: y,
                origindata:data
            })
        },
        calcTextLabel: function (content, v) {
            var that = this;
            var html = document.createElement('div')
            html.innerHTML = content;
            html.querySelectorAll(".bi-label-field").forEach(function (el) {
                var field = el.getAttribute("data-key");
                // if (field == that.option.valueName && that.option.formatValue) {
                //     field = that.option.formatValue;
                // }
                if (el.getAttribute("data-format") == 'true') {
                    field = '$$_format_' + field;
                }
                if (el && el.children) {
                    while (el && el.children.length >= 1) {
                        el = el.children[0]
                    }
                }
                if (v[field] != undefined) {
                    el.innerText = (v[field]);
                } else {
                    el.innerText = ''
                }
            })
            return html.innerHTML;
        },
        _setLabelStyle(div, css) {

            div.style.backgroundColor = css.backgroundColor;
            div.style.backgroundImage = 'url(' + css.backgroundImage + ')';
            div.style.backgroundSize = css.backgroundSize;
            div.style.fontSize = css.fontSize;
            div.style.lineHeight = css.lineHeight;
            div.style.color = css.color;
            div.style.borderRadius = css.borderRadius + 'px';
            div.style.borderWidth = css.borderWidth + 'px';
            div.style.borderStyle = css.borderStyle;
            div.style.borderColor = css.borderColor;
            div.style.padding = css.padding;
        },
        updateLabelPos() {
            if (!this.camera) {
                return;
            }
            this.labelArry.forEach((ele, j) => {
                var div = ele.dom;
                var position = ele.position;

                var worldVector = new THREE.Vector3(
                    position.x - this.center.x,
                    position.y - this.center.y,
                    position.z - this.center.z
                );
                if ((this.camera.rotation._x > -0.7 && this.camera.rotation._x < 0.9) && (this.camera.rotation._y > -0.7 && this.camera.rotation._y < 0.9)) {
                    div.style.display = 'block'
                    ele.isFirst = !ele.show;
                    ele.show = true
                    ele.z = 1;
                } else {
                    div.style.display = 'none';
                    ele.show = false;
                    ele.z = -1;
                }
                ele.index = 0;
                var standardVector = worldVector.project(this.camera);//世界坐标转标准设备坐标
                var a = this.option.width / 2;
                var b = this.option.height / 2;
                var x = Math.round(standardVector.x * a + a);//标准设备坐标转屏幕坐标
                var y = Math.round(-standardVector.y * b + b);//标准设备坐标转屏幕坐标
                /**
                 * 更新立方体元素位置
                 */

                // this.computeScatterPosition(j,x,y,div)
                ele.x = x;
                ele.y = y;
                if (this.option.label.wordAvoidance) {
                    this.getRect(ele);
                } else {
                    div.style.left = x + 'px';
                    div.style.top = y + 'px';
                }


            })
            if (this.option.label.wordAvoidance) {
                for (let i = 0; i < this.labelArry.length; i++) {
                    let temp = this.labelArry[i];
                    let div = temp.dom;
                    if(temp.origindata.$$_hide){
                        div.style.display = 'none'
                        continue;
                    }
                    temp.index = 0;
                    temp.available = {};
                    temp.show = !this._literalCheckMeet(i, temp, 0)
                    if (temp.show) {
                        div.style.left = temp.rect[temp.index].minX + 'px';
                        div.style.top = temp.rect[temp.index].minY + 'px';
                    } else {
                        if (temp.z > 0 && this.option.label.showAllLabel) {
                            div.style.left = temp.rect[temp.index].minX + 'px';
                            div.style.top = temp.rect[temp.index].minY + 'px';
                            div.style.display = 'block'
                        } else {
                            div.style.display = 'none'
                        }
                        // this.getMinIndex(temp);
                    }
                }
            }
        },
        _literalCheckMeet(i, temp, index) {
            let meet = true;
            for (let k = 0; k < 3; k++) {
                let ismeet = false;
                let meetarea = -1;
                for (let j = 0; j < this.labelArry.length; j++) {
                    if (i != j && this.labelArry[j].show && temp.show && index < 3) {
                        meetarea = this.isAnchorMeet(this.labelArry[j].rect[this.labelArry[j].index], temp.rect[k]);
                        if (meetarea > 0) {
                            ismeet = true;
                        }
                    }
                }
                if (!ismeet) {
                    if (meet) {
                        meet = false;
                        temp.index = k;
                    }

                } else {
                    temp.available[k] = meetarea;
                }
            }
            return meet;
        },
        getRect(ele) {
            let offsetX = 10;
            let offsetY = 10;
            let width = ele.dom.offsetWidth;
            let height = ele.dom.offsetHeight;
            ele.rect = [
                this._getLeftRect(ele, offsetX, offsetY, width, height),
                this._getRightRect(ele, offsetX, offsetY, width, height),
                this._getTopRect(ele, offsetX, offsetY, width, height),
                this._getBottomRect(ele, offsetX, offsetY, width, height),
            ]
        },
        _getRightRect(ele, offsetX, offsetY, width, height) {
            return {
                maxX: ele.x + offsetX + width,
                maxY: ele.y + height / 2,
                minX: ele.x + offsetX,
                minY: ele.y - height / 2,
                width: width,
                height: height,
            }
        },
        _getLeftRect(ele, offsetX, offsetY, width, height) {
            return {
                maxX: ele.x - offsetX,
                maxY: ele.y + height / 2,
                minX: ele.x - offsetX - width,
                minY: ele.y - height / 2,
                width: width,
                height: height,
            }
        },
        _getTopRect(ele, offsetX, offsetY, width, height) {
            return {
                maxX: ele.x + width / 2,
                maxY: ele.y - offsetY,
                minX: ele.x - width / 2,
                minY: ele.y - offsetY - height,
                width: width,
                height: height,
            }
        },
        _getBottomRect(ele, offsetX, offsetY, width, height) {
            return {
                maxX: ele.x + width / 2,
                minX: ele.x - width / 2,
                minY: ele.y + offsetY,
                maxY: ele.y + offsetY + height,
                width: width,
                height: height,
            }
        },
        isAnchorMeet(t1, t2) {
            let react = t1,
                targetReact = t2;
            // return (Math.min(react.minY, targetReact.minY) - Math.max(react.maxY, targetReact.maxY)) * (Math.min(react.maxX, targetReact.maxX) - Math.max(react.minX, targetReact.minX))
            //
            // let area=(targetReact.maxX-react.minX) * (targetReact.maxY - react.minY)
            // return area;
            if ((react.minX < targetReact.maxX) && (targetReact.minX < react.maxX) &&
                (react.minY < targetReact.maxY) && (targetReact.minY < react.maxY)) {
                let area = Math.abs((Math.min(react.minY, targetReact.minY) - Math.max(react.maxY, targetReact.maxY)) * (Math.min(react.maxX, targetReact.maxX) - Math.max(react.minX, targetReact.minX)))
                return area;
            }
            return -1;
        },
        addHotItems(hotDataMesh, isFly) {
            var sortCol = this.option.label.start.col || this.option.valueName
            this.option.data.sort((a, b) => {
                if (a[sortCol] < b[sortCol]) {
                    return this.option.label.start.sort == 'asc' ? -1 : 1;
                } else {
                    return this.option.label.start.sort == 'asc' ? 1 : -1;
                }
            })
            if ((!this.option.layer || this.option.layer.length <= 0) && isFly) {
                return;
            }
            this.option.data.forEach((obj, i) => {
                var lonlat = obj[this.option.lonlat].split(',');//经度
                if (!obj[this.option.lonlat]) {
                    return;
                }
                obj.$$lon = lonlat[0]
                obj.$$lat = lonlat[1]//纬度
                var SphereCoord1 = this.lonLat2Mercator(obj.$$lon, obj.$$lat);//SphereCoord球面坐标
                if ((this.option.label.start.hideLabel && i >= this.option.label.start.labelScope[0] && i <= this.option.label.start.labelScope[1]) || !this.option.label.start.hideLabel) {
                    this.addLabel(SphereCoord1, obj, 'start')
                }
            })
            if (this.option.layer && this.option.layer.length > 0) {
                for (let i = 0; i < this.option.layer.length; i++) {
                    this.addOneLayerItem(this.option.layer[i].col, this.option.layer[i], hotDataMesh)
                }
            } else if (!isFly) {
                this.addOneLayerItem(this.option.valueName, this.option.attr.hot, hotDataMesh)
            }

            // this.addOneLayerItem(col,attr);

        },
        addOneLayerItem(col, attr, hotDataMesh) {
            var [min, max, isLog,isNegative] = this.getMaxMin(this.option.data, col);
            var maxNum = max;
            var minNum = min;
            this.option.data.forEach((obj, i) => {
                var value = obj[col];
                if (isLog) {
                    value = value==0?0:Math.log(value);
                }
                if(isNegative){
                    value=value-minNum;
                }
                if (!obj[this.option.lonlat]) {
                    return;
                }
                if (!this._checkLegend(obj)) {
                    return;
                }
                var lon = obj.$$lon
                var lat = obj.$$lat//纬度
                // console.log(value,col)
                this.addBaseItem(hotDataMesh, attr, lon, lat, this.basetexture, this.lightbartexture, this.wavetexture, value, minNum, maxNum, obj, false)
            })
        },
        _addEarthItem(attr, isFly) {
            var textureLoader = new THREE.TextureLoader(); // TextureLoader创建一个纹理加载器对象
            this.basetexture = textureLoader.load(staticpath + '/static/标注.png');
            this.lightbartexture = textureLoader.load(staticpath + '/static/光柱.png');
            this.wavetexture = textureLoader.load(staticpath + '/static/光圈贴图.png');
            // this.calcMeshArry = [];
            this.WaveMeshArr = [];
            this.flyArr = [];
            this.ConeMeshArry = []
            var hotDataMesh = new THREE.Group();
            hotDataMesh.name = 'item'
            if (!isFly) {
                this.addHotItems(hotDataMesh, isFly);
            }
            if (isFly) {//飞线时需要重新计算起点和终点的值
                var endData = {};
                var startData = {};
                this.option.data.forEach((obj, i) => {
                    var endName = obj[this.option.toCountryName];
                    var startName = obj[this.option.countryName];
                    if (!endData[endName]) {
                        endData[endName] = {value: 0};
                    }
                    endData[endName].value += obj[this.option.valueName];

                    if (!startData[startName]) {
                        startData[startName] = {value: 0};
                    }
                    startData[startName].value += obj[this.option.valueName];
                })
                var [endMin, endMax, endisLog] = this.getMaxMinFromJSON(endData);
                var [startMin, startMax, startisLog] = this.getMaxMinFromJSON(startData);
                this.option.data.forEach((obj, i) => {
                    var lonlat = obj[this.option.lonlat].split(',');//经度
                    var lon = lonlat[0]
                    var lat = lonlat[1]//纬度
                    var tlonlat = obj[this.option.toLonlat].split(',');//经度
                    var tlon = tlonlat[0]
                    var tlat = tlonlat[1]//纬度

                    var flyLine = this.flyArc(lon, lat, tlon, tlat)
                    // if(attr.type.flyLine.show){
                    hotDataMesh.add(flyLine); //飞线插入flyArcGroup中
                    this.calcMeshArry.push(flyLine);
                    // }
                    this.flyArr.push(flyLine);//获取飞线段
                    flyLine.meshType = 'flyline'
                    flyLine.origindata = obj;
                    if (!attr.type.flyLine.show) {
                        flyLine.material.opacity = 0;
                    }
                    if (attr.type.flyPoint.show) {
                        var points = flyLine.flyTrackPoints;
                        var index = 20; //飞线索引起点

                        // var flyPoint = this.flylineFun(index, points); //绘制一段飞线
                        //
                        var flyPoint = this.addFlyPoint(index, points)
                        // //飞线取点索引范围：points.length - flyline.num
                        flyPoint.index = Math.floor((points.length - flyPoint.num) * Math.random()); //索引位置随机
                        flyLine.add(flyPoint); //飞线段flyline作为飞线轨迹flyTrack子对象，可以继承飞线轨迹平移旋转等变换
                    }

                    obj.$$_endData = endData[obj[this.option.toCountryName]];
                    obj.$$_startData = startData[obj[this.option.countryName]];
                    var endValue = obj.$$_endData.value;
                    if (endisLog) {
                        endValue = Math.log(endValue);
                    }
                    this.addBaseItem(hotDataMesh, attr, tlon, tlat, this.basetexture, this.lightbartexture, this.wavetexture, endValue, endMin, endMax, obj, isFly)
                    var SphereCoord = this.lonLat2Mercator(tlon, tlat);//SphereCoord球面坐标
                    this.addLabel(SphereCoord, obj, 'end')
                    if (obj.$$_startData && !obj.$$_startData.rendered) {//是起始点的时候画棱锥
                        if (!endData[obj[this.option.countryName]]) {
                            var SphereCoord = this.lonLat2Mercator(lon, lat);//SphereCoord球面坐标
                            var startValue = obj.$$_startData.value;
                            if (startisLog) {
                                startValue = Math.log(startValue);
                            }
                            var color = this._calcColorSeg(startValue, startMin, startMax, attr.colors)
                            if (attr.type.cone.show) {
                                var ConeMesh = this.createConeMesh(attr, this.mapSize * startValue * attr.type['cone'].height / (startMax), SphereCoord);//棱锥
                                hotDataMesh.add(ConeMesh);
                                ConeMesh.material.color.set(color)
                                this.ConeMeshArry.push(ConeMesh)
                            }
                            this.addLabel(SphereCoord, obj, 'start')
                            if (attr.type['circleLight'].show) {
                                var circleLight = this.createPointBaseMesh(attr, SphereCoord, this.basetexture);//光柱底座矩形平面
                                circleLight.material.color.set(color)
                                hotDataMesh.add(circleLight);
                            }
                            if (attr.type['wave'].show) {
                                var wave = this.createWaveMesh(attr, this.mapSize, SphereCoord, this.wavetexture);//波动光圈
                                hotDataMesh.add(wave);
                                wave.material.color.set(color)
                                this.WaveMeshArr.push(wave);
                            }
                            obj.$$_startData.rendered = true;
                        }
                    }
                })
            }
            // this.updateLabelPos()
            this.hotDataMesh = hotDataMesh;
            this.map.add(hotDataMesh)
        },
        addFlyPoint(index, points) {
            var choosePoints = []; //存储飞线轨迹上选择的顶点坐标，用于飞线绘制
            var num = 11; //从曲线上取11个点 飞线长度占飞线轨迹长度的10%  你可通过获取的点数调节飞线长度
            var group = new THREE.Group();
            var material = new THREE.MeshBasicMaterial({
                color: 0xffff00,//使用顶点颜色，材质颜色不用设置
                // vertexColors: THREE.VertexColors, //使用顶点颜色插值计算
                // linewidth: 6.5, // 设置线宽
            });
            for (var i = 1; i < num + 1; i++) {
                choosePoints.push(points[i + index])
                let position = points[i + index];
                let geometry = new THREE.SphereBufferGeometry(this.mapSize * i / (240 * num), 32, 32);

                // geometry.attributes.position.set();
                let mesh = new THREE.Mesh(geometry, material);
                mesh.position.x = position.x;
                mesh.position.y = position.y;
                mesh.position.z = position.z;
                group.add(mesh)

            }
            group.num = num;
            group.index = index;
            // this.scene.add(group)
            return group;
            // console.log(choosePoints)

        },
        flylineFun(index, points) {
            var choosePoints = []; //存储飞线轨迹上选择的顶点坐标，用于飞线绘制
            var num = 11; //从曲线上取11个点 飞线长度占飞线轨迹长度的10%  你可通过获取的点数调节飞线长度
            for (var i = 0; i < num; i++) {
                choosePoints.push(points[i + index])
            }
            // 创建一个LineGeometry几何体
            // var geometry = new THREE.BufferGeometry();
            // var geometry = new THREE.SphereBufferGeometry(this.mapSize/10,32,32);
            var group = new THREE.Group();
            var material = new THREE.MeshBasicMaterial({
                color: 0xffff00,//使用顶点颜色，材质颜色不用设置
                // vertexColors: THREE.VertexColors, //使用顶点颜色插值计算
                // linewidth: 6.5, // 设置线宽
            });
            var pointArr = [];
            //把样条曲线返回的顶点坐标Vector3中xyz坐标提取到pointArr数组中
            choosePoints.forEach((v3) => {
                var geometry = new THREE.SphereBufferGeometry(this.mapSize / 10, 32, 32);
                geometry.attributes.position = v3;
                var flyline = new THREE.Mesh(geometry, material);
                group.add(flyline)
                pointArr.push(v3.x, v3.y, v3.z)
                // let position=new THREE.Vector3()

            })
            group.num = num;
            group.index = index;
            return group;

            var attribue = new THREE.BufferAttribute(new Float32Array(pointArr), 3);
            // 设置几何体顶点位置坐标
            geometry.attributes.position = attribue;
            // 给几何体每个顶点设置对应颜色值
            var colorArr = []
            for (var i = 0; i < choosePoints.length; i++) {
                var color1 = new THREE.Color(0x006666); //飞线轨迹相近的颜色
                var color2 = new THREE.Color(0xffff00);
                var colo = null
                // posNum：插值计算的临界值  对应color2
                // var posNum = points.length/2;//飞线段，黄色居中，两侧青色
                var posNum = choosePoints.length - 2;
                if (i < posNum) {
                    colo = color1.lerp(color2, i / posNum)
                } else {
                    colo = color2.lerp(color1, (i - posNum) / (choosePoints.length - posNum))
                }
                colorArr.push(colo.r, colo.g, colo.b)
            }
            //设置几何体顶点颜色值，进行插值计算
            // geometry.setColors(colorArr);
            var colorattribue = new THREE.BufferAttribute(new Float32Array(colorArr), 3);
            // 设置几何体顶点位置坐标
            geometry.attributes.color = colorattribue;
            //几何体LineGeometry对应的材质LineMaterial
            var material = new THREE.MeshBasicMaterial({
                color: 0xffff00,//使用顶点颜色，材质颜色不用设置
                // vertexColors: THREE.VertexColors, //使用顶点颜色插值计算
                // linewidth: 6.5, // 设置线宽
            });
            //材质输入Three.js渲染canvas画布的宽高度
            // material.resolution.set(window.innerWidth, window.innerHeight);
            var flyline = new THREE.Mesh(geometry, material);
            // 自定义飞线属性flyline.num、flyline.index，用于飞线动画
            flyline.num = num;
            flyline.index = index;
            return flyline;
        },
        getMaxMinFromJSON(json) {
            var min, max;
            let isLog = false;
            for (let i in json) {
                if (json[i].value < min || min == undefined) {
                    min = json[i].value
                }
                if (json[i].value > max || max == undefined) {
                    max = json[i].value
                }
            }
            if (Math.log(max - min) > 2) {
                max = Math.log(max)
                min = Math.log(min)
                isLog = true;
            }
            return [min, max, isLog]
        },
        addBaseItem(hotDataMesh, attr, lon, lat, basetexture, lightbartexture, wavetexture, value, minNum, maxNum, origindata, isFly) {
            var height = this.mapSize * (value - minNum) / (maxNum - minNum);// 热度越高，光柱高度越高
            if(height<=0){
                return;
            }
            var circleLight, lightBar, wave, bar, ConeMesh, SphereMesh
            var SphereCoord = this.lonLat2Mercator(lon, lat);//SphereCoord球面坐标
            var SphereCoord1 = this.lonLat2Mercator(lon, lat);//SphereCoord球面坐标
            // if (!isFly) {
            //     this.addLabel(SphereCoord1, origindata, 'start')
            // }
            // SphereCoord1={x:lon,y:lat,z:0}
            if (attr.type['circleLight'].show) {
                circleLight = this.createPointBaseMesh(attr, SphereCoord1, basetexture, (value - minNum) / (maxNum - minNum));//光柱底座矩形平面
                hotDataMesh.add(circleLight);
                this.calcMeshArry.push(circleLight)
                circleLight.origindata = origindata;
            }

            if (attr.type['lightBar'].show) {
                // console.log((value - minNum),maxNum , minNum)
                height = height * parseFloat(attr.type.lightBar.ratio);
                lightBar = this.createLightPillar(attr, SphereCoord, height, lightbartexture);//光柱
                hotDataMesh.add(lightBar);
                this.calcMeshArry.push(lightBar)
                lightBar.origindata = origindata;
            }

            if (attr.type['wave'].show) {
                wave = this.createWaveMesh(attr, this.mapSize, SphereCoord1, wavetexture, (value - minNum) / (maxNum - minNum));//波动光圈
                hotDataMesh.add(wave);
                this.WaveMeshArr.push(wave);
                this.calcMeshArry.push(wave)
                wave.origindata = origindata;
            }

            if (attr.type['bar'].show) {
                height = height * parseFloat(attr.type.bar.ratio);
                bar = this.createPrism(this.mapSize, SphereCoord, height, attr)
                hotDataMesh.add(bar)
                this.calcMeshArry.push(bar)
                bar.origindata = origindata;
            }
            if (attr.type['cone'].show && !isFly) {
                ConeMesh = this.createConeMesh(attr, height * attr.type['cone'].height, SphereCoord);//棱锥
                hotDataMesh.add(ConeMesh);
                this.ConeMeshArry.push(ConeMesh)
                this.calcMeshArry.push(ConeMesh)
                ConeMesh.origindata = origindata;
            }
            // if (attr.type['sphere'].show && !isFly) {
            //     SphereMesh = this.createSphereMesh(attr, this.mapSize * (value - minNum) * attr.type['cone'].height / (maxNum - minNum), SphereCoord);//棱锥
            //     hotDataMesh.add(SphereMesh);
            //     // this.ConeMeshArry.push(DropMesh)
            //     this.calcMeshArry.push(SphereMesh)
            //     SphereMesh.origindata = origindata;
            // }
            this.changeColor(attr, value, minNum, maxNum, lightBar, circleLight, wave, bar, ConeMesh, SphereMesh);//设置热点Mesh颜色
        },
        createSphereMesh(attr, radius, SphereCoord) {
            if (radius < 1) {
                radius = 1;
            }
            // var radius = R / 32;//圆锥半径  和地球半径建立尺寸关系
            var height = radius * attr.type.sphere.ratio;//棱锥高度
            // 圆锥体几何体API(ConeGeometry)圆周方向四等分实现四棱锥效果
            var geometry = new THREE.SphereBufferGeometry(height, 32, 32);
            // 缓冲类型几何体BufferGeometry没有computeFlatVertexNormals方法
            // geometry.computeFlatVertexNormals();//一种计算顶点法线方式，非光滑渲染
            // 可以根据需要旋转到特定角度
            // geometry.rotateX(Math.PI);
            geometry.rotateX(-Math.PI / 2);
            // geometry.translate(0, 0, height / 2);
            // MeshBasicMaterial MeshLambertMaterial
            var material = new THREE.MeshLambertMaterial({
                color: 0x00ffff,
                side: THREE.DoubleSide,
            });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(SphereCoord.x, SphereCoord.y, this.mapSize * parseFloat(this.option.baseGlobal.depth*0.1) * 1.03);
            return mesh;
        },
        // createDropMesh(attr,radius,SphereCoord){
        //     if (radius < 1) {
        //         radius = 1;
        //     }
        //     // var radius = R / 32;//圆锥半径  和地球半径建立尺寸关系
        //     var height = radius * attr.type.cone.ratio;//棱锥高度
        //     // 圆锥体几何体API(ConeGeometry)圆周方向四等分实现四棱锥效果
        //     var geometry = new THREE.ConeGeometry(radius, height,32);
        //     // 缓冲类型几何体BufferGeometry没有computeFlatVertexNormals方法
        //     geometry.computeFlatVertexNormals();//一种计算顶点法线方式，非光滑渲染
        //     // 可以根据需要旋转到特定角度
        //     // geometry.rotateX(Math.PI);
        //     geometry.rotateX(-Math.PI / 2);
        //     geometry.translate(0, 0, height / 2);
        //     // MeshBasicMaterial MeshLambertMaterial
        //     var material = new THREE.MeshLambertMaterial({
        //         color: 0x00ffff,
        //         side: THREE.DoubleSide,
        //     });
        //     var mesh = new THREE.Mesh(geometry, material);
        //
        //     // 棱锥上在叠加一个棱锥
        //     var geometry2 = new THREE.SphereBufferGeometry(radius, 32,32);
        //     // 缓冲类型几何体BufferGeometry没有computeFlatVertexNormals方法
        //     // geometry2.computeFlatVertexNormals();//一种计算顶点法线方式，非光滑渲染
        //     // 可以根据需要旋转到特定角度
        //     // geometry.rotateX(Math.PI);
        //     geometry2.rotateX(-Math.PI / 2);
        //     geometry2.translate(0, 0, height / 2);
        //     var mesh2 = new THREE.Mesh(geometry2, material);
        //     // mesh2.scale.z = 0.5;
        //     mesh2.position.z = height * (1 + mesh2.scale.z);
        //     mesh2.rotateX(Math.PI);
        //     mesh.add(mesh2);
        //
        //     mesh.position.set(SphereCoord.x, SphereCoord.y, this.mapSize * parseFloat(this.option.baseGlobal.depth*0.1) * 1.03);
        //     return mesh;
        // },
        createConeMesh(attr, radius, SphereCoord) {
            if (radius < 1) {
                radius = 1;
            }
            // var radius = R / 32;//圆锥半径  和地球半径建立尺寸关系
            var height = radius * attr.type.cone.ratio;//棱锥高度
            // 圆锥体几何体API(ConeGeometry)圆周方向四等分实现四棱锥效果
            var geometry = new THREE.ConeGeometry(radius, height, attr.type.cone.segments);
            // 缓冲类型几何体BufferGeometry没有computeFlatVertexNormals方法
            geometry.computeFlatVertexNormals();//一种计算顶点法线方式，非光滑渲染
            // 可以根据需要旋转到特定角度
            // geometry.rotateX(Math.PI);
            geometry.rotateX(-Math.PI / 2);
            geometry.translate(0, 0, height / 2);
            // MeshBasicMaterial MeshLambertMaterial
            var material = new THREE.MeshLambertMaterial({
                color: 0x00ffff,
                side: THREE.DoubleSide,
            });
            var mesh = new THREE.Mesh(geometry, material);

            // 棱锥上在叠加一个棱锥
            var mesh2 = mesh.clone();
            mesh2.scale.z = 0.5;
            mesh2.position.z = height * (1 + mesh2.scale.z);
            mesh2.rotateX(Math.PI);
            mesh.add(mesh2);

            mesh.position.set(SphereCoord.x, SphereCoord.y, this.mapSize * parseFloat(this.option.baseGlobal.depth*0.1) * 1.03);
            return mesh;
        },
        changeColor(attr, value, minNum, maxNum, LightPillar, mesh, WaveMesh, barMesh, ConMesh, SphereMesh) {
            // console.log(value,minNum,maxNum,color)
            var color = new THREE.Color(lerp(attr.colors, Math.sqrt((value - minNum) / (maxNum - minNum))));
            // 光柱颜色设置
            LightPillar && (LightPillar.children[0].material.color.set(color));
            // 光柱底座颜色设置
            mesh && (mesh.material.color.set(color));
            // 波动光圈颜色设置
            WaveMesh && (WaveMesh.material.color.set(color));
            barMesh && (barMesh.material.color.set(color));
            ConMesh && (ConMesh.material.color.set(color));
            SphereMesh && (SphereMesh.material.color.set(color));
        },
        addfly() {
            this.addarea(true, () => {
                this._addEarthItem(this.option.attr.fly, true)
            })

        },
        flyArc(lon1, lat1, lon2, lat2) {
            var attr = this.option.attr.fly.type.flyLine
            var type = attr.lineType;
            var dashSize = attr.dashSize;
            var gapSize = attr.gapSize;
            var sphereCoord1 = this.lonLat2Mercator(lon1, lat1);//经纬度坐标转球面坐标
            // startSphereCoord：轨迹线起点球面坐标
            var start = new THREE.Vector3(sphereCoord1.x, sphereCoord1.y, this.mapSize * parseFloat(this.option.baseGlobal.depth*0.1) * 1.03);
            var sphereCoord2 = this.lonLat2Mercator(lon2, lat2);
            // startSphereCoord：轨迹线结束点球面坐标
            var end = new THREE.Vector3(sphereCoord2.x, sphereCoord2.y, this.mapSize * parseFloat(this.option.baseGlobal.depth*0.1) * 1.03);

            var length = start.clone().sub(end).length();
            var H = length * 0.1; //根据两点之间距离设置弧线高度
            var middle = new THREE.Vector3(0, 0, 0);
            middle.add(start).add(end).divideScalar(2)
            // middle.y += H;
            middle.z += H; //调整高度方向为z

            var geometry = new THREE.Geometry(); //声明一个几何体对象Geometry
            // 起始点坐标和弧线高度确定一条3D样条曲线
            var curve = new THREE.CatmullRomCurve3([
                start,
                middle,
                end
            ]);
            var points = curve.getPoints(100); //分段数100，返回101个顶点，返回一个vector3对象作为元素组成的数组
            geometry.setFromPoints(points); // setFromPoints方法从points中提取数据改变几何体的顶点属性vertices
            //材质对象
            var materialoption = {
                color: attr.color || '#ffffff',
                transparent: true,
            }
            if (type == 'Dashed') {
                materialoption = {
                    color: attr.color || '#ffffff',
                    dashSize: dashSize,
                    gapSize: gapSize,
                    scale: 1,
                    transparent: true,
                }
            }

            var material = new THREE['Line' + type + 'Material'](materialoption);
            //线条模型对象
            // var line = new THREE.Line(geometry, material);
            if (type == 'Dashed') {
                var line = new THREE.LineSegments(geometry, material);//线条模型对象
            } else {
                var line = new THREE.Line(geometry, material);//线条模型对象
            }
            line.flyTrackPoints = points; // 自定义属性用于飞线动画
            return line;
        },
        addhot() {
            this.addarea(true, () => {
                this._addEarthItem(this.option.attr.hot)

            })
        },
        createPrism(R, SphereCoord, height, attr) {
            var geometry = new THREE.CylinderGeometry(this.mapSize * attr.type.bar.radiusTop, this.mapSize * attr.type.bar.radiusBottom, height, attr.type.bar.segments);//正六棱柱
            geometry.computeFlatVertexNormals();//一种计算顶点法线方式，非光滑渲染
            geometry.rotateX(Math.PI / 2);//高度方向旋转到z轴上

            geometry.translate(0, 0, height / 2);//平移使柱子底部与XOY平面重合
            var material = new THREE.MeshLambertMaterial({
                color: '#ffffff',
            });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(SphereCoord.x, SphereCoord.y, this.mapSize * parseFloat(this.option.baseGlobal.depth*0.1) * 1.03);//设置mesh位置
            this.calcMeshArry.push(mesh)
            return mesh;
        },
        _calcColorSeg(value, min, max, colors) {
            var step = (max - min) / colors.length;
            // var colorArry=[];
            for (let i = 0; i < colors.length; i++) {
                let min1 = i * step + min;
                let max1 = min1 + step;
                if (value >= min1 && value < max1) {
                    // console.log(value,min1,max1)
                    return colors[i]
                }
                // colorArry.push({
                //     color:colors[i],
                //     scope:[min,max]
                // })
            }
            return colors[colors.length - 1]
        },
        createWaveMesh(attr, R, SphereCoord, texture, valueSize) {
            var geometry = new THREE.PlaneBufferGeometry(1, 1); //默认在XOY平面上
            // 如果不同mesh材质的透明度、颜色等属性不同，材质不能共享
            var material = new THREE.MeshBasicMaterial({
                color: 0x22ffcc,
                map: texture,
                transparent: true, //使用背景透明的png贴图，注意开启透明计算
                opacity: 1.0,
                // side: THREE.DoubleSide, //双面可见
                depthWrite: false,//禁止写入深度缓冲区数据
            });
            var mesh = new THREE.Mesh(geometry, material);
            // 经纬度转球面坐标
            // var coord = this.lon2xyz(R * 1.001, lon, lat)
            var size = R * attr.type.wave.width * ((valueSize == undefined ? 1 : valueSize) + 0.1);//矩形平面Mesh的尺寸
            mesh.size = size;//自顶一个属性，表示mesh静态大小
            mesh.scale.set(size, size, size);//设置mesh大小
            mesh._s = Math.random() * 1.0 + 1.0;//自定义属性._s表示mesh在原始大小基础上放大倍数  光圈在原来mesh.size基础上1~2倍之间变化
            // mesh.scale.set(mesh.size*mesh._s,mesh.size*mesh._s,mesh.size*mesh._s);
            //设置mesh位置
            mesh.position.set(SphereCoord.x, SphereCoord.y, this.mapSize * parseFloat(this.option.baseGlobal.depth*0.1) * 1.07);

            return mesh;
        },
        createLightPillar(attr, SphereCoord, height, texture) {
            // 矩形平面网格模型设置背景透明的png贴图
            // var height = R*0.3;//光柱高度，和地球半径相关，这样调节地球半径，光柱尺寸跟着变化
            var geometry = new THREE.PlaneBufferGeometry(this.mapSize * attr.type.lightBar.width, height); //默认在XOY平面上
            geometry.rotateX(Math.PI / 2);//光柱高度方向旋转到z轴上
            geometry.translate(0, 0, height / 2);//平移使光柱底部与XOY平面重合
            var material = new THREE.MeshBasicMaterial({
                map: texture,
                //color: 0x44ffaa, //光柱颜色，光柱map贴图是白色，可以通过color调节颜色
                transparent: true, //使用背景透明的png贴图，注意开启透明计算
                side: THREE.DoubleSide, //双面可见
                depthWrite: false,//是否对深度缓冲区有任何的影响
            });
            var mesh = new THREE.Mesh(geometry, material);
            var group = new THREE.Group();
            // 两个光柱交叉叠加
            // group.add(mesh, mesh.clone().rotateY(Math.PI / 2))
            group.add(mesh, mesh.clone().rotateZ(Math.PI / 2));//几何体绕x轴旋转了，所以mesh旋转轴变为z
            // 经纬度转球面坐标
            // var SphereCoord = this.lon2xyz(R, lon, lat);//SphereCoord球面坐标
            group.position.set(SphereCoord.x, SphereCoord.y, this.mapSize * parseFloat(this.option.baseGlobal.depth*0.1) * 1.03);//设置mesh位置
            // mesh姿态设置
            // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
            return group;
        },
        createPointBaseMesh(attr, SphereCoord, texture, valueSize) {
            var geometry = new THREE.PlaneBufferGeometry(1, 1); //默认在XOY平面上
            var material = new THREE.MeshBasicMaterial({
                color: '#ffffff',
                map: texture,
                transparent: true, //使用背景透明的png贴图，注意开启透明计算
                // side: THREE.DoubleSide, //双面可见
                depthWrite: true,//禁止写入深度缓冲区数据
                depthTest: true
            });
            var mesh = new THREE.Mesh(geometry, material);
            // 经纬度转球面坐标
            // var SphereCoord1 = this.lon2xyz(R * 1.001, lon, lat)
            var size = this.mapSize * attr.type.circleLight.width * ((valueSize == undefined ? 1 : valueSize) + 0.1);//矩形平面Mesh的尺寸
            mesh.scale.set(size, size, size);//设置mesh大小
            //设置mesh位置
            mesh.position.set(SphereCoord.x, SphereCoord.y, this.mapSize * parseFloat(this.option.baseGlobal.depth*0.1) * 1.07);
            return mesh;
        },
        calcAreaCountryColor(data, col, attr) {
            var col = col || this.option.valueName;
            var json = {};
            var colors = attr ? attr.colors : this.option.attr.area.colors;
            // var color1 = new THREE.Color(this.option.attr.area.colors[0]);
            // var color2 = new THREE.Color(this.option.attr.area.colors[1]);
            var [min, max, isLog,isNegative] = this.getMaxMin(data, col);
            var maxNum = max;
            var minNum = min;
            data.forEach(obj => {
                var name = obj[this.option.countryName];
                var value = obj[col];
                if (isLog) {
                    value = value==0?0:Math.log(value);
                }
                if(isNegative){
                    value=value+minNum;
                }
                var color = null;
                if (!value) {
                    value = 0;
                }
                // color = color1.clone().lerp(color2.clone(), Math.sqrt((value - minNum) / maxNum));
                color = new THREE.Color(lerp(colors, Math.sqrt((value - minNum) / (maxNum - minNum))));
                json[name] = {
                    color: color,
                    origindata: obj
                }
            })
            return json;
        },
        getMaxMin(data1, name) {
            let isLog = false;
            let isNegative=false;
            let {min, max} = this._getMaxMinFunc(data1, name)
            if (max / min > 1 && min>1) {
                min = min==0?0:Math.log(min);
                max = Math.log(max);
                isLog = true;
            }
            if (min == max) {
                min = 0;
            }
            if(min<0){
                min=-min;
                max=max-min;
                isNegative=true;
            }
            return [min, max, isLog,isNegative]
        },
        _getMaxMinFunc(data1, name) {
            var data = $.extend(true, [], data1)
            data.sort((d1, d2) => {
                if (d1[name] > d2[name]) {
                    return 1;
                } else {
                    return -1;
                }
            })
            var min = $.extend(true, {}, data[0])[name];
            var max = $.extend(true, {}, data[data.length - 1])[name];
            return {min, max}
        },
        initThree() {
            var scene = new THREE.Scene();
            var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
            directionalLight.position.set(400, 200, 300);
            scene.add(directionalLight);
            var directionLight2 = new THREE.DirectionalLight(0xffffff, 0.6)
            directionLight2.position.set(-400, -200, -300);
            scene.add(directionLight2);
            var ambient = new THREE.AmbientLight(0xffffff, 0.6)
            scene.add(ambient);
            // var axesHelper = new THREE.AxesHelper(20000000);
            // scene.add(axesHelper)
            var width = this.option.width;
            var height = this.option.height;
            var k = width / height;
            var s = 180;
            // var camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
            // camera.position.set(0, -80, 200); //相机在Three.js坐标系中的位置
            // camera.lookAt(0, 0, 0);//注意多边形轮廓不居中问题
            this.mapSize = 360;
            var s = this.mapSize / 2;//根据地图尺寸设置相机渲染范围
            //创建相机对象
            var camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
            // camera.position.set(11, -280, 299); //沿着z轴观察
            camera.position.set(0, -60, 299); //沿着z轴观察
            camera.lookAt(scene.position); //指向中国地图的几何中心
            var renderer = new THREE.WebGLRenderer({
                antialias: true, //开启锯齿
                alpha: true
            });
            renderer.setPixelRatio(window.devicePixelRatio);//设置设备像素比率,防止Canvas画布输出模糊。
            renderer.setSize(width, height); //设置渲染区域尺寸
            renderer.setClearColor(this.option.backgroundColor, this.option.backgroundOpacity); //设置背景颜色
            // renderer.domElement表示Three.js渲染结果,也就是一个HTML元素(Canvas画布)
            this.dom.appendChild(renderer.domElement); //body元素中插入canvas画布
            //执行渲染操作   指定场景、相机作为参数
            this.renderer = renderer;
            // this.mesh=mesh;
            // this.WaveMeshArr=WaveMeshArr;
            this.camera = camera;
            this.scene = scene;
            this.renderer.render(this.scene, this.camera);
            this.rotate = 0;
            this.render();
        },
        centerCamera(mapGroup, camera) {
            // 地图mapGroup的包围盒计算
            var box3 = new THREE.Box3(); //创建一个包围盒
            box3.expandByObject(mapGroup); // .expandByObject()方法：计算层级模型group包围盒
            var center = new THREE.Vector3(); //scaleV3表示包围盒的几何体中心
            box3.getCenter(center); // .getCenter()计算一个层级模型对应包围盒的几何体中心
            // 重新设置模型的位置
            mapGroup.position.x = mapGroup.position.x - center.x;
            mapGroup.position.y = mapGroup.position.y - center.y;
            mapGroup.position.z = mapGroup.position.z - center.z;
            this.center = center;

            var width = this.option.width;
            var height = this.option.height;
            var k = width/height;
            /*可以根据中国地图mapGroup的包围盒尺寸设置相机参数s */
            this.scaleV3 = new THREE.Vector3(); //scaleV3表示包围盒长宽高尺寸
            box3.getSize(this.scaleV3) // .getSize()计算包围盒长宽高尺寸
            // frame.js文件中var s = 150; 150更改为scaleV3.x/2
            var maxL = this.maxLFun(this.scaleV3);
            // maxL=100;
            //重新设置s值 乘以0.5适当缩小显示范围，地图占canvas画布比例更大，自然渲染范围更大
            // var s = maxL*0.5;
            var s = this.scaleV3.y*(parseFloat(this.option.baseGlobal.resize)||0.7);

            camera.rotation.x=0.19;
            camera.left = -s * k;
            camera.right = s * k;
            camera.top = s;
            camera.bottom = -s;

            // camera.bottom = -s * k;
            // camera.top = s * k;
            // camera.right = s;
            // camera.left = -s;

            camera.position.set(0, this.option.baseGlobal.isPlane?0:-maxL/2, maxL); //沿着z轴观察
            camera.lookAt(this.scene.position); //指向中国地图的几何中心
            camera.near = -maxL * 4;
            camera.far = maxL * 4;
            camera.updateProjectionMatrix();
            this.mapSize = maxL;
        },
        maxLFun(v3) {
            var max;
            if (v3.x > v3.y) {
                max = v3.x
            } else {
                max = v3.y
            }
            if (max > v3.z) {
            } else {
                max = v3.z
            }
            return max;
        },
        updateFlyGeo(flyline, index, points) {
            var pointArr = []; //存储飞线轨迹上选择的顶点坐标，用于飞线绘制
            for (var i = 0; i < flyline.num; i++) {
                var v3 = points[i + index]
                pointArr.push(v3.x, v3.y, v3.z)
                let mesh = flyline.children[i];
                mesh.position.x = v3.x;
                mesh.position.y = v3.y;
                mesh.position.z = v3.z;
            }
            // 设置几何体顶点位置坐标
            // flyline.geometry.attributes.position = new THREE.BufferAttribute(new Float32Array(pointArr), 3);
            // flyline.geometry.verticesNeedUpdate = true; //通知three.js几何体顶点位置坐标数据更新
        },
        render() {
            if (!this.scene) {
                cancelAnimationFrame(this.animationId)
                return;
            }
            let startAnimate = false;
            if (this.flyArr && this.flyArr.length > 0) {
                startAnimate = true;
                this.flyArr.forEach((flyTrack, i) => {
                    // 获取飞线轨迹线上的顶点坐标，用于飞线段绘制
                    var points = flyTrack.flyTrackPoints;
                    var flyline = flyTrack.children[0];
                    var indexMax = points.length - flyline.num; //飞线取点索引范围
                    if (flyline.index < indexMax) {
                        flyline.index += 1
                    } else {
                        flyline.index = 0
                    }
                    this.updateFlyGeo(flyline, flyline.index, points); //更新飞线的位置，生成飞行动画

                });
            }
            if (this.WaveMeshArr && this.WaveMeshArr.length > 0) {
                startAnimate = true;
                this.WaveMeshArr.forEach(function (mesh) {
                    mesh._s += 0.007;
                    mesh.scale.set(mesh.size * mesh._s, mesh.size * mesh._s, mesh.size * mesh._s);
                    if (mesh._s <= 1.5) {
                        mesh.material.opacity = (mesh._s - 1) * 2;//2等于1/(1.5-1.0)，保证透明度在0~1之间变化
                    } else if (mesh._s > 1.5 && mesh._s <= 2) {
                        mesh.material.opacity = 1 - (mesh._s - 1.5) * 2;//2等于1/(2.0-1.5) mesh缩放2倍对应0 缩放1.5被对应1
                    } else {
                        mesh._s = 1.0;
                    }
                })
            }
            if (this.ConeMeshArry && this.ConeMeshArry.length) {
                startAnimate = true;
                this.ConeMeshArry.forEach(mesh => {
                    mesh.rotation.z += 0.02
                })
            }
            this.labelRenderer.render(this.scene, this.camera)
            this.renderer.render(this.scene, this.camera);
            // console.log(startAnimate)
            // if(startAnimate){
            this.animationId = requestAnimationFrame(this.render.bind(this))
            // }

        },
        addControl() {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            if(this.option.baseGlobal.isPlane){
            this.controls.enableRotate=false;}
            // this.controls.enabled=false;
            // this.scene.add(this.controls);
            // this.controls.maxPolarAngle = Math.PI / 2;
            // this.controls.minPolarAngle = -Math.PI / 2;
            // this.controls.maxAzimuthAngle = Math.PI / 2;
            // this.controls.minAzimuthAngle = -Math.PI / 2;
            this.controls.update();
            this.controls.addEventListener('change', () => {
                this.updateLabelPos();
            });

            // this.controls.addEventListener( 'change', this.render );
            //
            // this.controls.addEventListener( 'dragging-changed', function ( event ) {
            //
            //     // orbit.enabled = ! event.value;
            //
            // } );
            // this.controls.attach(this.map)
            // this.scene.add(this.controls);
        },
        pointInPolygon(point, vs) {
            var x = point[0],
                y = point[1];
            var inside = false;
            for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                var xi = vs[i][0],
                    yi = vs[i][1];
                var xj = vs[j][0],
                    yj = vs[j][1];
                var intersect = ((yi > y) != (yj > y)) &&
                    (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        },
        gridPoint(polygon) {
            var lonArr = [];//polygon的所有经度坐标
            var latArr = [];//polygon的所有纬度坐标
            polygon.forEach(elem => {
                lonArr.push(elem[0])
                latArr.push(elem[1])
            });
            // minMax()计算polygon所有经纬度返回的极大值、极小值
            var [lonMin, lonMax] = this.minMax(lonArr);
            var [latMin, latMax] = this.minMax(latArr);
            // 经纬度极小值和极大值构成一个矩形范围，可以包裹多边形polygon，在矩形范围内生成等间距顶点
            //  设置均匀填充点的间距
            var 间隔 = this.option.baseGlobal.gridStep || 3; //polygon轮廓内填充顶点的经纬度间隔距离，选择一个合适的值，太小，计算量大，太大，国家球面不够光滑
            var 行 = Math.ceil((lonMax - lonMin) / 间隔);//经度方向填充多少行的顶点
            var 列 = Math.ceil((latMax - latMin) / 间隔)//纬度方向填充多少列的顶点
            var rectPointsArr = [];//polygon对应的矩形轮廓内生成均匀间隔的矩形网格数据rectPointsArr
            for (var i = 0; i < 行 + 1; i++) {
                for (var j = 0; j < 列 + 1; j++) {
                    //两层for循环在矩形范围内批量生成等间距的网格顶点数据
                    rectPointsArr.push([lonMin + i * 间隔, latMin + j * 间隔])
                }
            }
            // 处理矩形网格顶点数据rectPointsArr，仅仅保留多边形轮廓polygon内的顶点数据
            var polygonPointsArr = [];//polygon轮廓内的网格顶点数据
            rectPointsArr.forEach((coord) => {//coord:点经纬度坐标
                if (this.pointInPolygon(coord, polygon)) {//判断点coord是否位于多边形中
                    polygonPointsArr.push(coord)
                }
            })
            //polygon：多边形轮廓边界顶点数据
            // polygonPointsArr：polygon内部的等间距顶点数据
            // 多边形polygon边界坐标和polygon内等间距顶点坐标合并返回
            return [[...polygon, ...polygonPointsArr], polygonPointsArr];
        },
        minMax(arr1) {
            // 数组元素排序
            var arr = $.extend(true, [], arr1);
            arr.sort((num1, num2) => {
                if (num1 < num2) {
                    return -1;
                } else if (num1 > num2) {
                    return 1;
                } else {
                    return 0;
                }
            });
            // 通过向两侧取整，把经纬度的方位稍微扩大
            return [Math.floor(arr[0]), Math.ceil(arr[arr.length - 1])]
        },
        setLabelRender() {
            var labelRenderer = new CSS2DRenderer();
            labelRenderer.setSize(this.option.width, this.option.height);
            labelRenderer.domElement.style.position = 'absolute';
// 相对鼠标单击位置偏移
            labelRenderer.domElement.style.top = '-16px';
            labelRenderer.domElement.style.left = '0px';
// //设置.pointerEvents=none，以免模型标签HTML元素遮挡鼠标选择场景模型
            labelRenderer.domElement.style.pointerEvents = 'none';
            this.labelRenderer = labelRenderer;
            this.dom.appendChild(labelRenderer.domElement);
        },
        addtooltip() {
// 创建div元素(作为标签)
            var div = document.createElement('div');
            div.classList.add('xnwebglobal-tooltip')
            div.style.visibility = 'hidden';
            div.innerHTML = '';
            div.style.padding = '4px 10px';
            div.style.color = this.option.tooltip.color;
            div.style.fontSize = '14px';
            div.style.position = 'absolute';
            div.style.backgroundColor = this.option.tooltip.backgroundColor;
            div.style.borderRadius = '2px';
            //div元素包装为CSS2模型对象CSS2DObject
            // var label = new CSS2DObject(div);
            div.style.pointerEvents = 'none';//避免HTML标签遮挡三维场景的鼠标事件
            // 设置HTML元素标签在three.js世界坐标中位置
            // label.position.set(x, y, z);
            this.dom.appendChild(div);
            return div;//返回CSS2模型标签
        },
        addEvent() {
            var choosePointMesh = e => {
                this.mouseoverearth = false;
                if ($(e.target).parents('.xnmap-container').get(0) && $(e.target).parents('.xnmap-container').get(0).getAttribute('data-id') == this.id) {
                    this.mouseoverearth = true;
                    if (this.chooseMesh) {
                        if (this.chooseMesh.meshType == 'area') {
                            this.chooseMesh.material.color.set(this.chooseMesh.color)
                        }
                        this.tooltip.style.visibility = 'hidden';
                        // this.chooseMesh.material.color.set('#ffffff')
                    }
                    var Sx = event.clientX - this.dom.getBoundingClientRect().left; //鼠标单击位置横坐标
                    var Sy = event.clientY - this.dom.getBoundingClientRect().top; //鼠标单击位置纵坐标
                    //屏幕坐标转WebGL标准设备坐标
                    var x = (Sx / this.dom.getBoundingClientRect().width) * 2 - 1; //WebGL标准设备横坐标
                    var y = -(Sy / this.dom.getBoundingClientRect().height) * 2 + 1; //WebGL标准设备纵坐标

                    var standardVector = new THREE.Vector3(x, y, 0.5);//标准设备坐标
                    //标准设备坐标转世界坐标
                    var worldVector = standardVector.unproject(this.camera);
                    var ray = worldVector.sub(this.camera.position).normalize();
                    var raycaster = new THREE.Raycaster();
                    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
                    var intersects = raycaster.intersectObjects(this.calcMeshArry);
                    if (intersects.length > 0 && this.option.tooltip.show) {
                        this.chooseMesh = intersects[0].object;
                        // console.log(intersects[0].point)
                        // this.tooltip.position.copy(intersects[0].point);
                        this.tooltip.innerHTML = this.chooseMesh.name;
                        this.tooltip.style.visibility = 'visible';
                        this.tooltip.style.left = Sx+10+'px';
                        this.tooltip.style.top = Sy+10+'px';
                        if (this.chooseMesh.meshType == 'area') {
                            this.chooseMesh.material.color.set(this.option.baseGlobal.hoverColor)
                            if (this.chooseMesh.origindata) {
                                var content = (this.calcTextTooltip(this.option.tooltip.content, this.chooseMesh.origindata))
                                this.tooltip.innerHTML = content;
                            }
                        }
                        if (this.chooseMesh.origindata) {
                            var content = (this.calcTextTooltip(this.option.tooltip.content, this.chooseMesh.origindata))
                            this.tooltip.innerHTML = content;
                        }
                        // if (this.chooseMesh.meshType == 'flyline' && this.chooseMesh.origindata) {
                        //     var content = (this.calcTextTooltip(this.option.tooltip.content, this.chooseMesh.origindata))
                        //     this.tooltip.element.innerHTML = content;
                        // }
                        // if (this.chooseMesh.meshType != 'area' && this.chooseMesh.meshType != 'fly') {
                        //     var content = (this.calcTextTooltip(this.option.tooltip.content, this.chooseMesh.origindata))
                        //     this.tooltip.element.innerHTML = content;
                        //     // this.tooltip.element.innerHTML = '';
                        // }

                    } else {
                        this.chooseMesh = null;
                    }
                }
            }
            var clickPointMesh = e => {
                choosePointMesh(e)
                if (this.chooseMesh) {
                    // this.chooseMesh.material.color.set('#ffaa00')
                }
            }
            addEventListener('mousemove', choosePointMesh)
            addEventListener('click', clickPointMesh)
            this.choosePointMesh = choosePointMesh;
            this.clickPointMesh = clickPointMesh;
            // this.addResizeEvent();
        },
        calcTextTooltip: function (content, v) {
            var that = this;
            var html = document.createElement('div')
            html.innerHTML = content;
            html.querySelectorAll(".bi-label-field").forEach(function (el) {
                var field = el.getAttribute("data-key");
                // if (field == that.option.valueName && that.option.formatValue) {
                //     field = that.option.formatValue;
                // }
                if (el.getAttribute("data-format") == 'true') {
                    field = '$$_format_' + field;
                }
                if (el && el.children) {
                    while (el && el.children.length >= 1) {
                        el = el.children[0]
                    }
                }

                if (v && v[field] != undefined) {
                    el.innerHTML = (v[field]);
                } else {
                    el.innerHTML = ''
                }
            })
            return html.innerHTML;
        },
        addResizeEvent() {
            addEventListener('resize', e => {
                this.resize(600, 400)
            })
        },
        resize(width, height) {
            if (!this.camera) {
                return;
            }
            this.renderer.setSize(width, height);
            this.option.width = width;
            this.option.height = height;
            var k = width/height;
            var s = this.scaleV3.y*(parseFloat(this.option.baseGlobal.resize)||0.7);
            this.camera.left = -s * k;
            this.camera.right = s * k;
            this.camera.updateProjectionMatrix();
            this.updateLabelPos();
        },
        on: function (type, func, refresh) {
            if (!this.eventList[type]) {
                this.eventList[type] = {
                    listener: [func]
                }
            } else {
                if (refresh) {
                    this.eventList[type].listener = [func]
                } else {
                    this.eventList[type].listener.push(func)
                }
            }
        },
        trigger: function (type) {
            if (!this.eventList[type]) {
                return;
            }
            for (let i = 0; i < this.eventList[type].listener.length; i++) {
                let listener = this.eventList[type].listener[i];
                if (typeof listener == 'function') {
                    listener(arguments[1], this.dom)
                }
            }
        },
        destory() {
            this.scene = null;
            this.camera = null;
            this.controls = null;
            this.id = null;
            cancelAnimationFrame(this.animationId)
            this.animationId = null;
            removeEventListener('mousemove', this.choosePointMesh)
            removeEventListener('click', this.clickPointMesh)
        }
    }
    window.XNWebglMap = XNWebglMap;
})(window, XNQuery, staticpath)
var staticpath = document.currentScript.src;
var staticpath = staticpath.substr(0, staticpath.lastIndexOf('/'));
