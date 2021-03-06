/*
 * Copyright (c) 2019-Today N. Justus
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

package webmodelica.services

import pdi.jwt.{Jwt, JwtAlgorithm, JwtClaim, JwtHeader, JwtOptions}
import webmodelica.models.User

import scala.concurrent.duration._
import scala.util.{Failure, Success, Try}
import java.time.Instant

import com.twitter.util.Future
import io.circe.generic.JsonCodec
import webmodelica.conversions.futures

case class UserTokenPayload(username: String)
@JsonCodec
case class UserToken(username:String, iat: Option[Long], exp: Long)

/** Generator & Validator for our own JWT tokens. */
class TokenGenerator(secret:String, exp:Duration=(15 minutes)) extends TokenValidator {
  import io.circe.generic.auto._
  import io.circe.parser
  import io.circe.syntax._

  private val algorithm = JwtAlgorithm.HS384
  private val expiration = exp.toSeconds

  def newToken(u:User): String = {
    val payload = UserTokenPayload(u.username).asJson.toString
    val claim = JwtClaim(payload).issuedNow.expiresIn(expiration)
    Jwt.encode(claim, secret, algorithm)
  }
  override def decode(token:String): Future[UserToken] = {
    val decodedEither = Jwt.decodeAll(token, secret, Seq(algorithm)).toEither.flatMap {
      case (_, payload,_) => parser.decode[UserToken](payload)
    }
    futures.eitherToFuture(decodedEither)
  }
  override def decodeToUser(token:String): Future[Option[User]] = Future.value(None)
  override def isValid(token:String): Boolean = Jwt.isValid(token, secret, Seq(algorithm))
  def validate(token:String): Unit = Jwt.validate(token, secret, Seq(algorithm))

  override def toString: String = s"TokenGenerator($exp)"
}
