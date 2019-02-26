package webmodelica.controllers

import com.twitter.finatra.http.Controller
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import webmodelica.stores.UserStore
import webmodelica.services.{
  TokenGenerator,
  UserToken
}
import webmodelica.models.{User, errors}

trait UserExtractor {
  def userStore: UserStore
  def gen: TokenGenerator

  def extractToken(req:Request): Future[UserToken] =
    errors.notFoundExc("no web-token provided!")(req.authorization).flatMap(gen.decode)

  def extractUser(req:Request): Future[User] =
    for {
      token <- extractToken(req)
      userOpt <- userStore.findBy(token.username)
      user <- errors.notFoundExc("web-token contains invalid user informations!")(userOpt)
  } yield user
}