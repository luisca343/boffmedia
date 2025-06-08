import { Controller, Get, HttpStatus, UseInterceptors } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { RegionService } from "./region.service"
import { WingullService } from "../wingull/wingull.service"
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor'

@ApiTags("smartrotom/regions")
@Controller("smartrotom/regions")
@UseInterceptors(ResponseInterceptor)
export class RegionController {
    constructor(
        private readonly regionService: RegionService,
        private readonly wingullService: WingullService,
    ) {}

    @Get()
    @ApiOperation({ summary: "Get regions" })
    @ApiResponse({ status: HttpStatus.OK, description: "Regions retrieved successfully." })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: "Failed to retrieve regions." })
    async getRegions() {
        return await this.wingullService.getRegions(this.regionService.townColors);
    }
}