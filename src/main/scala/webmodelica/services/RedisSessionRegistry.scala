/*
 * Copyright (c) 2019-Today N. Justus
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

package webmodelica.services

import com.twitter.util.{Future, Time}
import webmodelica.{UUIDStr, constants}
import webmodelica.models.config._
import webmodelica.models.{Project, Session}
import webmodelica.conversions.futures._

import scala.concurrent.duration._
import cats.data.OptionT
import cats.implicits._

class RedisSessionRegistry(
  conf:WMConfig,
  redisProvider: RedisCacheFactory,
  client: AkkaHttpClient)
    extends SessionRegistry
    with com.typesafe.scalalogging.LazyLogging {

  val redis = redisProvider.get[Session](constants.sessionCacheSuffix, _ => Future.value(None), Some(8 hours))

  private def newService(s:Session): SessionService =
    s.mopeId match {
      case None => new SessionService(conf.mope, s, redisProvider, client)
      case Some(id) =>
        new SessionService(conf.mope, s, redisProvider, client) {
          override def projectId: Future[Int] = Future.value(id)
        }
    }

  override def create(p:Project): Future[(SessionService, Session)] = {
    //tmp set mopeId to unknown
    val tmpSession = Session(p, mopeId=None)
    logger.info(s"creating session $tmpSession")
    val service = newService(tmpSession)
    for {
      mopeId <- service.connect()
      session = tmpSession.copy(mopeId=mopeId.some)
      _ <- redis.update(session.idString, session)
    } yield (service, session)
  }
  override def get(id:UUIDStr): Future[Option[SessionService]] =
    OptionT(redis.find(id)).map(newService).value

  override def killSession(id:UUIDStr): Future[Unit] = {
    redis.find(id).flatMap {
      case Some(session) =>
        logger.info(s"kill session $id")
        newService(session).close(Time.fromSeconds(60))
        redis.remove(id)
    case None => Future.value(())
    }
  }

  override def close(deadline:Time):Future[Unit] = Future.value(())
}
