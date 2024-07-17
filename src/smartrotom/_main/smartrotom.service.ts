import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SmartrotomService {


    async getStats(uuid: string) {
        return axios.post(`${process.env.WINGULL_API}/stats`, {uuid}).then((res)=>res.data)
    }
    getTeam(uuid: string) {
        return axios.post(`${process.env.WINGULL_API}/equipo`, {uuid}).then((res)=>res.data)
    }

}
