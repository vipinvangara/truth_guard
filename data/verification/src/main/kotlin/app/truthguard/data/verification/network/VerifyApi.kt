package app.truthguard.data.verification.network

import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

interface VerifyApi {
    @POST("v1/verify")
    suspend fun verify(
        @Header("X-Device-Token") deviceToken: String,
        @Body request: VerifyRequestDto
    ): VerifyResponseDto
}
