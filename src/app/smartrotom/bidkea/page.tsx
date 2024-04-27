"use client"
import { Canvas } from "@react-three/fiber";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useLoader } from "@react-three/fiber";
import { TextureLoader, MaterialLoader, Texture } from "three";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { useEffect, useState } from "react";
import { OrbitControls } from '@react-three/drei';


export default function PokedexMenu(){
    const [obj, setObj] = useState(null as any);
    const texture = useLoader(TextureLoader, '/smartrotom/armourers/model-exports/A.png');

    useEffect(() => {
        new MTLLoader().setPath('/smartrotom/armourers/model-exports/').load('A.mtl', function (materials) {
            materials.preload();
            new OBJLoader().setMaterials(materials).setPath('/smartrotom/armourers/model-exports/').load('A.obj', function (object) {
                object.traverse((child: { isMesh: any; material: { map: Texture; }; }) => {
                    if (child.isMesh) {
                        child.material.map = texture;
                    }
                });
                setObj(object);
            });
        });
    
    }
    , [])

    return (
        <div>
            <h1>Bidkea</h1>
            <div className="w-1/2 h-1/2">
            <Canvas frameloop="demand" camera={{ position: [90, 0, 0], fov: 30, near: 0.1, far: 200 }}> 
                    <ambientLight />
                    <pointLight position={[10, 10, 10]} />
                    <primitive object={obj} />
                    <OrbitControls />
                    
                </Canvas>
            </div>
        </div>
    )
}