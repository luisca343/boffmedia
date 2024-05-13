"use client"
import { Canvas } from "@react-three/fiber";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useLoader } from "@react-three/fiber";
import { TextureLoader, MaterialLoader, Texture } from "three";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { useEffect, useRef, useState } from "react";
import { CameraShake, Environment, OrbitControls, PerspectiveCamera, Preload, View, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber'


export default function BidkeaMenu(){
    const ref = useRef()


return (<>
    <div className="flex justify-evenly p-2" style={{ position: 'relative', width: '100%', height: '100%' }} ref={ref.current}>
        <ModelView name="Sayori" />
        <ModelView name="A" />
        <ModelView name="luffy" />
        <ModelView name="piano" />

        {/** Fixed fullscreen canvas on top of everything, events tied to index root */}
        <Canvas
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' }}
          eventSource={ref.current}>
          <View.Port />
          <Preload all />
        </Canvas>
    </div></>
    )
}

  function ModelView({name, color=''} : {name: string, color?: string}){
    const [size, setSize] = useState(0);
    const [fov, setFov] = useState(0);

    useEffect(() => {
        fetch(`/smartrotom/armourers/model-exports/${name}.obj`)
            .then(response => {
                const size = parseInt(response.headers.get('Content-Length') as string)
                setSize(size / 1024);
            })
            .catch(console.error);
        }, []);
        
        useEffect(() => {
            if(size <= 300) setFov(15);
            if(size > 300) setFov(30);
            if(size > 1500) setFov(40);
        }, [size]);

        return(
            <View className="view scale z-10 border-2 rounded-sm border-black" style={{ height: 200, width:200 }}>
                {color && <color attach="background" args={[color]} />}
                <ambientLight intensity={0.5} />
                <pointLight position={[20, 30, 10]} intensity={1} />
                <pointLight position={[-10, -10, -10]} color="blue" />
                <Environment preset="dawn" />

                <ArmourerModel name={name} />
                <OrbitControls makeDefault />
                <PerspectiveCamera makeDefault fov={fov} position={[90, 0, 0]} />
            </View>
        )
  }

  export function ArmourerModel({name} : {name: string}){
    const [obj, setObj] = useState(null as any);
    const texture = useLoader(TextureLoader, `/smartrotom/armourers/model-exports/${name}.png`);

    useEffect(() => {
        new MTLLoader().setPath('/smartrotom/armourers/model-exports/').load(`${name}.mtl`, function (materials) {
            materials.preload();
            new OBJLoader().setMaterials(materials).setPath('/smartrotom/armourers/model-exports/').load(`${name}.obj`, function (object) {
                object.traverse((child: { isMesh: any; material: { map: Texture; }; }) => {
                    if (child.isMesh) {
                        child.material.map = texture;
                    }
                });
                setObj(object);
                console.log(object);
            });
        });
    
    }, [])

    if(!obj) return <>LOADING</>
    return <primitive object={obj} />
    
  }