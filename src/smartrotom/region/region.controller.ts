import { Controller, Get, HttpStatus, Inject } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { ResponseService } from "@/response/response.service"
import { RegionService } from "./region.service"

@ApiTags("smartrotom/regions")
@Controller("smartrotom/regions")
export class RegionController {
    constructor(
        @Inject(RegionService) private readonly regionService: RegionService,
        @Inject(ResponseService) private readonly responseService: ResponseService,
    ) {}

  @Get()
  @ApiOperation({ summary: "Get regions" })
  @ApiResponse({ status: HttpStatus.OK, description: "Regions retrieved successfully." })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: "Failed to retrieve regions." })
  async getRegions() {
    const action = "get regions"
    try {
      this.responseService.logRequest(action, {})
      const regions = await this.regionService.getRegions()
      this.responseService.logSuccess(action, regions)
      return this.responseService.createSuccessResponse("Regions retrieved successfully", regions)
    } catch (error) {
      this.responseService.handleError(action, error, {})
    }
  }
}

