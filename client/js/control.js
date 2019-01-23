
// 数组删除操作
Array.prototype.indexOf = function (val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};

Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

// 移动端摇杆操作
function Joystick(opt) {
    if (!opt.zone) return;
    var disabledColor = opt && opt.disabledColor || true;
    this.options = {
        mode: opt && opt.mode || 'static',
        size: opt && opt.size || 150, // color在nipplejs中是设置backgroundColor，为了让我们样式不被覆盖。所以设置一个让background-color不成功的值 
        color: disabledColor ? '#ddd' : (opt && opt.color || '#eee'),
        position: opt && opt.position || { left: '10%', bottom: '20%' },
        zone: opt && opt.zone
    };
    this.distance = 0;
    this.angle = null;
    this.time = null;
}

var isMobile = false;

Joystick.prototype.init = function () {
    var manager = nipplejs.create(this.options); this.manager = manager; this._on();
    return this;
}
Joystick.prototype._on = function () {
    var me = this; this.manager.on('start', function (evt, data) {
        me.time = setInterval(() => {
            me.onStart && me.onStart(me.distance, me.angle);
        }, 100);
    }).on('move', function (evt, data) { // direction有不存在的情况
        if (data.direction) {
            me.angle = data.direction.angle; me.distance = data.distance;
        }
    }).on('end', function (evt, data) {
        clearInterval(me.time); me.onEnd && me.onEnd();
    });
}

var PointerLockCanonBody = null;
var previousTouchClientX = 0;
var previousTouchClientY = 0;
var PointerLockControls = function (camera, cannonBody) {
    PointerLockCanonBody = cannonBody;
    var eyeYPos = 2; // 相机距离地面观测距离
    var velocityFactor = 0.1;
    var jumpVelocity = 10;
    var scope = this;

    var pitchObject = new THREE.Object3D();
    pitchObject.add(camera);

    var yawObject = new THREE.Object3D();
    yawObject.position.y = 2;
    yawObject.add(pitchObject);

    var quat = new THREE.Quaternion();

    var moveForward = false;
    var moveBackward = false;
    var moveLeft = false;
    var moveRight = false;

    var canJump = false;

    var contactNormal = new CANNON.Vec3(); // Normal in the contact, pointing *out* of whatever the player touched
    var upAxis = new CANNON.Vec3(0, 1, 0);
    cannonBody.addEventListener("collide", function (e) {
        var contact = e.contact;
        // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
        // We do not yet know which one is which! Let's check.
        if (contact.bi.id == cannonBody.id) // bi is the player body, flip the contact normal
            contact.ni.negate(contactNormal);
        else
            contactNormal.copy(contact.ni); // bi is something else. Keep the normal as it is

        // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
        if (contactNormal.dot(upAxis) > 0.5) // Use a "good" threshold value between 0 and 1 here!
            canJump = true;
    });
    var velocity = cannonBody.velocity;
    var PI_2 = Math.PI / 2;
    var onMouseMove = function (event) {
        if (scope.enabled === false) return;
        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
        yawObject.rotation.y -= movementX * 0.002;
        pitchObject.rotation.x -= movementY * 0.002;
        pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
    };

    var onKeyDown = function (event) {
        // 按键事件映射
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = true;
                break;
            case 37: // left
            case 65: // a
                moveLeft = true;
                break;
            case 40: // down
            case 83: // s
                moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                moveRight = true;
                break;
            case 32: // space
                if (canJump === true) {
                    velocity.y = jumpVelocity;
                }
                canJump = false;
                break;
        }
    };

    var mobile_joystick = new Joystick({ zone: document.querySelector('#layer_joystick') }).init();

    mobile_joystick.onStart = function (distance, angle) {
        // 摇杆动作出触发
        switch (angle) {
            case 'up':
                moveForward = true;
                break;
            case 'left':
                moveLeft = true;
                break;
            case 'down':
                moveBackward = true;
                break;
            case 'right':
                moveRight = true;
                break;
        }
    };

    mobile_joystick.onEnd = function (distance, angle) {
        // 释放摇杆
        moveForward = false;
        moveLeft = false;
        moveBackward = false;
        moveRight = false;
    };

    var onKeyUp = function (event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // a
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;

        }

    };

    var onTouchMove = function (event) {
        if (scope.enabled === false) return;
        event.preventDefault();
        var movementX = event.touches[0].clientX - previousTouchClientX || 0;
        var movementY = event.touches[0].clientY - previousTouchClientY || 0;
        previousTouchClientX = event.touches[0].clientX;
        previousTouchClientY = event.touches[0].clientY;
        yawObject.rotation.y -= movementX * 0.004;
        pitchObject.rotation.x -= movementY * 0.004;
        pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
    };

    var onTouchStart = function (event) {
        if (scope.enabled === false) return;
        previousTouchClientX = event.touches[0].clientX;
        previousTouchClientY = event.touches[0].clientY;
    };

    var prevent = function (event) {
        // 判断默认行为是否可以被禁用
        if (event.cancelable) {
            // 判断默认行为是否已经被禁用
            if (!event.defaultPrevented) {
                event.preventDefault();
            }
        }
    }

    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    document.addEventListener('touchstart', prevent, false);
    document.addEventListener('touchmove', prevent, false);
    document.body.addEventListener('touchmove', prevent, false);



    setTimeout(function () {
        renderer.domElement.addEventListener('touchstart', onTouchStart, false);
        renderer.domElement.addEventListener('touchmove', onTouchMove, false);
    }, 500);

    this.enabled = false;

    this.getObject = function () {
        return yawObject;
    };

    this.getDirection = function (targetVec) {
        targetVec.set(0, 0, -1);
        quat.multiplyVector3(targetVec);
    }

    // Moves the camera to the Cannon.js object position and adds velocity to the object if the run key is down
    var inputVelocity = new THREE.Vector3();
    var euler = new THREE.Euler();
    this.update = function (delta) {
        if (scope.enabled === false) return;
        // 基本加速度
        delta *= 0.2;
        inputVelocity.set(0, 0, 0);
        if (moveForward) {
            inputVelocity.z = -velocityFactor * delta;
        }
        if (moveBackward) {
            inputVelocity.z = velocityFactor * delta;
        }

        if (moveLeft) {
            inputVelocity.x = -velocityFactor * delta;
        }
        if (moveRight) {
            inputVelocity.x = velocityFactor * delta;
        }

        // Convert velocity to world coordinates
        euler.x = pitchObject.rotation.x;
        euler.y = yawObject.rotation.y;
        euler.order = "XYZ";
        quat.setFromEuler(euler);
        inputVelocity.applyQuaternion(quat);
        //quat.multiplyVector3(inputVelocity);
        // Add to the object
        velocity.x += inputVelocity.x;
        velocity.z += inputVelocity.z;
        if (DisplayerController.died) {
            velocity.y = 18;
        }
        yawObject.position.copy(cannonBody.position);
    };
};

//########################
// code start

var sphereShape, sphereBody, world, physicsMaterial, walls = [],
    balls = [],
    ballMeshes = [],
    boxes = [],
    boxMeshes = [];

var camera, scene, renderer;
var geometry, material, mesh;
var controls, time = Date.now();

var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if (havePointerLock) {
    var element = document.body;
    var pointerlockchange = function (event) {
        if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
            controls.enabled = true;
            blocker.style.display = 'none';
        } else {
            controls.enabled = false;
            blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';
            instructions.style.display = '';
        }

    }

    var pointerlockerror = function (event) {
        instructions.style.display = '';
    }

    // Hook pointer lock state change events
    document.addEventListener('pointerlockchange', pointerlockchange, false);
    document.addEventListener('mozpointerlockchange', pointerlockchange, false);
    document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

    document.addEventListener('pointerlockerror', pointerlockerror, false);
    document.addEventListener('mozpointerlockerror', pointerlockerror, false);
    document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

    instructions.addEventListener('click', function (event) {
        instructions.style.display = 'none';

        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        if (/Firefox/i.test(navigator.userAgent)) {
            var fullscreenchange = function (event) {
                if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
                    document.removeEventListener('fullscreenchange', fullscreenchange);
                    document.removeEventListener('mozfullscreenchange', fullscreenchange);
                    element.requestPointerLock();
                }
            }
            document.addEventListener('fullscreenchange', fullscreenchange, false);
            document.addEventListener('mozfullscreenchange', fullscreenchange, false);
            element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
            element.requestFullscreen();
        } else {
            element.requestPointerLock();
        }
    }, false);
    isMobile = false;
} else {
    // 不支持鼠标锁定
    // 启用移动设备触摸操作
    // controls.enabled = true;
    // controls.mobile = true;
    isMobile = true;
    blocker.style.display = 'none';
}

initCannon();
init();
animate();

function initCannon() {
    // Setup our world
    world = new CANNON.World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;

    var solver = new CANNON.GSSolver();

    world.defaultContactMaterial.contactEquationStiffness = 1e9;
    world.defaultContactMaterial.contactEquationRelaxation = 4;

    solver.iterations = 7;
    solver.tolerance = 0.1;
    var split = true;
    if (split)
        world.solver = new CANNON.SplitSolver(solver);
    else
        world.solver = solver;

    world.gravity.set(0, -20, 0);
    world.broadphase = new CANNON.NaiveBroadphase();

    // Create a slippery material (friction coefficient = 0.0)
    physicsMaterial = new CANNON.Material("slipperyMaterial");
    var physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial,
        physicsMaterial,
        0.0, // friction coefficient
        0.3 // restitution
    );
    // We must add the contact materials to the world
    world.addContactMaterial(physicsContactMaterial);

    // Create a sphere
    var mass = 5, radius = 1.3;
    sphereShape = new CANNON.Sphere(radius);
    sphereBody = new CANNON.Body({
        mass: mass
    });
    sphereBody.addShape(sphereShape);
    sphereBody.position.set(0, 5, 0);
    sphereBody.linearDamping = 0.9;
    world.add(sphereBody);

    // Create a plane
    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.Body({
        mass: 0
    });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.add(groundBody);
}

function init() {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMapSoft = true;
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    renderer.domElement;

    window.addEventListener('resize', onWindowResize, false);
    scene = new THREE.Scene();

    var updateFcts = [];
    // 天空颜色
    scene.fog = new THREE.FogExp2(0xd0e0f0, 0.0025);
    renderer.setClearColor(scene.fog.color, 1);

    var proceduralCity = new THREEx.ProceduralCity();
    // var building		= proceduralCity.getBuilding().clone()
    // proceduralCity.scaleBuilding(building)
    // proceduralCity.colorifyBuilding(building)
    // scene.add(building)	

    // var mesh = proceduralCity.createMrDoobCity()
    var mesh = proceduralCity.createSquareCity();
    scene.add(mesh);

    // 阳光
    var light = new THREE.HemisphereLight(0xfffff0, 0x101020, 1.25);
    light.position.set(0.75, 1, 0.25);
    scene.add(light);

    controls = new PointerLockControls(camera, sphereBody);
    scene.add(controls.getObject());
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

var dt = 1 / 60;

function animate() {
    requestAnimationFrame(animate);
    if (controls.enabled || isMobile) {
        world.step(dt);
        // Update ball positions
        for (var i = 0; i < balls.length; i++) {
            ballMeshes[i].position.copy(balls[i].position);
            ballMeshes[i].quaternion.copy(balls[i].quaternion);
        }
        // Update box positions
        for (var i = 0; i < boxes.length; i++) {
            boxMeshes[i].position.copy(boxes[i].position);
            boxMeshes[i].quaternion.copy(boxes[i].quaternion);
        }
    }
    controls.update(Date.now() - time);
    renderer.render(scene, camera);
    time = Date.now();
}

// 子弹形状
var ballShape = new CANNON.Sphere(0.05);
var ballGeometry = new THREE.SphereGeometry(ballShape.radius, 32, 32);
var shootDirection = new THREE.Vector3();
var shootVelo = 300; //初速度
var projector = new THREE.Projector();

// 获取射击坐标
function getShootDir(targetVec) {
    var vector = targetVec;
    targetVec.set(0, 0, 1);
    vector.unproject(camera);
    var ray = new THREE.Ray(sphereBody.position, vector.sub(sphereBody.position).normalize());
    targetVec.copy(ray.direction);
}

// 射击事件
window.addEventListener("click", function (e) {
    DisplayerController.shoot();
});


var DisplayerController = {
    life: 100,
    died: false,
    players: {},
    removed: {},
    rifle: null,
    shotgun: null,
    activeWeapon: -1,
    playerCount: 1,
    updateLife: function (input_life) {
        if (input_life <= 0) {
            document.getElementById("val_life").innerHTML = 0;
            this.died = true;
            controls.enabled = true;
            document.getElementById('blocker').style.display = 'none';
            blocker.style.display = 'none';
            $("#dead").fadeIn(1200);
            return
        }
        this.life = input_life;
        document.getElementById("val_life").innerHTML = this.life;
    },
    updateScore: function (input_score) {
        document.getElementById("val_score").innerHTML = input_score;
        document.getElementById("final_score").innerHTML = input_score;
    },
    loadWeapons() {
        var thatCamera = camera;
        var that = this;

        var mtlLoader = new THREE.MTLLoader();
        var objLoader = new THREE.OBJLoader();
        var texture = null;

        // 武器模型加载
        mtlLoader.setPath("models/");
        mtlLoader.load("material.mtl", function (materials) {
            materials.preload();
            objLoader.setMaterials(materials);
            objLoader.setPath("models/");
            objLoader.load("m4a1_s.obj", function (object) {
                texture = THREE.ImageUtils.loadTexture('models/m4a1_stext.png');
                object.children[1].material = new THREE.MeshLambertMaterial({ map: texture });
                //M4步枪
                object.children[1].position.set(0, 0, 0);
                object.children[1].scale.set(0.05, 0.05, 0.05);
                object.children[1].rotation.set(0.1, 3.4, 0);
                object.children[1].position.set(0.5, -0.2, -0.3);
                that.rifle = object.children[1];
                thatCamera.add(that.rifle);
                that.activeWeapon = 0;
            });
        });

        mtlLoader.setPath("models/");
        mtlLoader.load("material.mtl", function (materials) {
            materials.preload();
            objLoader.setMaterials(materials);
            objLoader.setPath("models/");
            objLoader.load("escopeta.obj", function (object) {
                texture = THREE.ImageUtils.loadTexture('models/escopetatext.png');
                object.children[0].material = new THREE.MeshLambertMaterial({ map: texture });
                //卡宾枪
                object.children[0].position.set(0, 0, 0);
                object.children[0].scale.set(0.4, 0.4, 0.4);
                object.children[0].rotation.set(0.2, -1.2, 0);
                object.children[0].position.set(2, -1.4, -6);
                object.children[0].material.transparent = true;
                object.children[0].material.opacity = 0.0;
                that.shotgun = object.children[0];
                thatCamera.add(that.shotgun);
            });
        });
    },
    hasPlayer: function (playerId) {
        if (this.players[playerId] == null) {
            return false;
        }
        if (this.players[playerId] == "REMOVED") {
            return false;
        }
        if (this.removed[playerId] == true) {
            return false;
        }
        return true;
    },
    newPlayer: function (playerId, x, y, z) {
        this.removed[playerId] = false;
        var playerBody = new CANNON.Body({
            mass: 5
        });
        var playerMaterial = new THREE.MeshPhongMaterial({
            color: '#' + '' + (playerId + 26) % 100 + '' + (playerId + 39) % 100 + '' + playerId % 100
        });
        var playerMaterialShot = new THREE.MeshPhongMaterial({
            color: '#FF5566'
        });
        var playerShape = new CANNON.Sphere(0.8);
        var playerGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8, 1, 1, 1);
        var playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
        playerBody.addShape(playerShape);
        playerBody.position.set(x, y, z);
        playerMesh.position.set(x, y, z);
        playerMesh.castShadow = true;
        playerMesh.receiveShadow = true;

        world.add(playerBody);
        scene.add(playerMesh);
        this.players[playerId] = {
            id: playerId,
            body: playerBody,
            mesh: playerMesh,
            position: {
                x: x,
                y: y,
                z: z
            },
            quaternion: {
                x: 0,
                y: 0,
                z: 0
            }
        }
    },
    removePlayer: function (playerId) {
        // 从场景清除玩家
        if (this.hasPlayer(playerId)) {
            scene.remove(this.players[playerId].mesh);
            world.remove(this.players[playerId].body);
            this.players[this.playerId] = "REMOVED";
            this.playerCount--;
            if (this.playerCount < 1) {
                this.playerCount = 1;
            }
            this.removed[playerId] = true;
            document.getElementById("val_player_num").innerHTML = this.playerCount;
        }
    },
    updatePlayer: function (playerId, lx, ly, lz, quaternion) {
        if (this.hasPlayer(playerId)) {
            this.animate(playerId);
            this.players[playerId].position = {
                x: lx,
                y: ly,
                z: lz
            };
            // this.players[playerId].quaternion = {
            //     x: quaternion.x,
            //     y: quaternion.y,
            //     z: quaternion.z,
            //     w: quaternion.w
            // };
        } else {
            this.newPlayer(playerId, lx, ly, lz);
            this.playerCount++;
            document.getElementById("val_player_num").innerHTML = this.playerCount;
            // alert('Added player ' + playerId);
        }
    },
    animate: function (playerId) {
        // 玩家移动动画处理
        // requestAnimationFrame(this.animate(playerId));
        world.step(dt);
        // 物体位置
        this.players[playerId].mesh.position.copy(this.players[playerId].position);
        // 物体转角  
        // this.players[playerId].mesh.quaternion.copy(balls[i].quaternion);
        controls.update(Date.now() - time);
        renderer.render(scene, camera);
        time = Date.now();
    },
    shoot: function () {
        if (this.died) {
            // 死亡后射击无效
            return;
        }
        if (controls.enabled == true) {
            var x = sphereBody.position.x;
            var y = sphereBody.position.y;
            var z = sphereBody.position.z;
            var ballBody = new CANNON.Body({
                mass: 0.01
            });
            ballBody.addShape(ballShape);
            var randomColor = '#E6E61A';
            material2 = new THREE.MeshPhongMaterial({
                color: randomColor,
                specular: '#E0E013',
                emissive: '#E5E205',
                shininess: 60
            });
            var ballMesh = new THREE.Mesh(ballGeometry, material2);
            world.add(ballBody);
            scene.add(ballMesh);
            ballMesh.castShadow = true;
            ballMesh.receiveShadow = true;
            balls.push(ballBody);
            ballMeshes.push(ballMesh);
            getShootDir(shootDirection);


            NetworkController.sendMessage('EV_SHT',
                {
                    // 保留4位小数即可 节省WS带宽
                    lx: new Number(PointerLockCanonBody.position.x.toFixed(4)),
                    ly: new Number(PointerLockCanonBody.position.y.toFixed(4)),
                    lz: new Number(PointerLockCanonBody.position.z.toFixed(4)),
                    dx: new Number(shootDirection.x.toFixed(4)),
                    dy: new Number(shootDirection.y.toFixed(4)),
                    dz: new Number(shootDirection.z.toFixed(4))
                }
            )

            var gun_sound = new Howl({
                src: ['sounds/m4a1_s.mp3'], volume: 0.1
            });
            gun_sound.play();

            ballBody.velocity.set(shootDirection.x * shootVelo,
                shootDirection.y * shootVelo,
                shootDirection.z * shootVelo);

            // alert("X=" + shootDirection.x + "y=" + shootDirection.y + "z=" + shootDirection.z);

            // Move the ball outside the player sphere
            x += shootDirection.x * (sphereShape.radius + ballShape.radius);
            y += shootDirection.y * (sphereShape.radius + ballShape.radius);
            z += shootDirection.z * (sphereShape.radius + ballShape.radius);
            ballBody.position.set(x, y, z);
            ballMesh.position.set(x, y, z);
        }
    },
    playerShoted: function (playerId, byWhom) {

    },
    playerDied: function (playerId) {

    }
}

var NetworkController = {
    myId: -1,
    socket: null,
    isConnected: false,
    connect: function Connect() {
        try {
            this.socket = new WebSocket('ws://localhost:9000');
        } catch (e) {
            alert('socket error');
            return;
        }
        this.socket.onopen = this.onOpen;
        this.socket.onerror = this.onError;
        this.socket.onmessage = this.onMessage;
        this.socket.onclose = this.onClose;
    },
    onMessage: function (message) {
        console.log(message.data);
        var received_data = JSON.parse(message.data);
        // received_data.data = JSON.parse(received_data.data);
        switch (received_data.type) {
            case "UPD_LOC":
                var player = received_data.data;
                if (player.i != this.myId) {
                    DisplayerController.updatePlayer(player.i, player.x, player.y, player.z, null);
                } else {
                    DisplayerController.updateLife(player.l);
                    DisplayerController.updateScore(player.s);
                }
                break;
            case "RM_PLY":
                var player = received_data.data;
                if (player.i != this.myId) {
                    DisplayerController.removePlayer(player.i);
                }
                break;
            case "PLY_SHT":
                var player = received_data.data;

                break;
            case "PLY_SHTD":
                var player = received_data.data;
                if (player.i != this.myId) {
                    // 打中其他玩家 更新自己的分数

                } else {
                    // 自己被打中
                    $("#layer_blood").fadeIn(200);
                    setTimeout(function () {
                        $("#layer_blood").fadeOut(200);
                    }, 1000);
                }
                break;
            case "HELLO":
                this.myId = received_data.data.id;
                // alert("HELLO! PLAYER " + this.myId);
                break;
        }
    },
    onOpen: function () {
        this.isConnected = true;
        NetworkController.sendMessage("HELLO", null);
    },
    onClose: function () {
        alert('很抱歉，与服务器的连线断开。');
        controls.enabled = false;

        document.getElementById("instructions").innerHTML = '网络已断开，请检测连接状况并重新进入游戏。';
        blocker.style.display = '';
        this.isConnected = false;
    },
    onError: function (err) {
        alert('连接错误。');
        this.isConnected = false;
    },
    sendMessage: function (type, content) {
        if (this.socket.readyState === this.socket.OPEN) {
            this.socket.send(JSON.stringify({ type: type, data: content }));
        }
    }
}

var EventManager = {
    heartbeat: function () {
        // 心跳每100毫秒一次
        setInterval(
            function () {
                if (PointerLockCanonBody != null && !DisplayerController.died) {
                    NetworkController.sendMessage('HB_EV_UPD_LOC', // 心跳事件
                        {
                            // 保留4位小数即可 节省WS带宽
                            lx: new Number(PointerLockCanonBody.position.x.toFixed(3)),
                            ly: new Number(PointerLockCanonBody.position.y.toFixed(3)),
                            lz: new Number(PointerLockCanonBody.position.z.toFixed(3)),
                            quaternion: {
                                x: new Number(PointerLockCanonBody.quaternion.x.toFixed(3)),
                                y: new Number(PointerLockCanonBody.quaternion.y.toFixed(3)),
                                z: new Number(PointerLockCanonBody.quaternion.z.toFixed(3)),
                                w: new Number(PointerLockCanonBody.quaternion.w.toFixed(3)),
                            }
                        }
                    )
                }
            }, 35)
    }
}

DisplayerController.loadWeapons();

// 连接网络
NetworkController.connect();

// 开启心跳
EventManager.heartbeat();


setTimeout(function () {
    if (isMobile) {
        controls.enabled = true;
    }
}, 600)
