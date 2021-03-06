/*
 * Copyright (c) 2019-Today N. Justus
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

package webmodelica.services

import better.files._
import webmodelica.models._
import webmodelica.models.config._
import java.nio.file._

class SessionServicePathMapperSpec
    extends webmodelica.WMSpec {

  val tmpDir = File.newTemporaryDirectory("mapperspec-tmp")
  val conf = MopeClientConfig("http://localhost:9015/", 800, MopeDataConfig(tmpDir.path, Paths.get("/data/wm")))
  val session = Session(Project("nico", "testproj"))
  val service = new SessionService(conf, session,NoCaching.cacheFactory, module.httpClient)
  val mapper = service.pathMapper
  val bindRoot = conf.data.bindDirectory.resolve(session.basePath)
  val hostRoot = service.fsStore.rootDir

  override def afterAll:Unit = tmpDir.delete()

  "The PathMapper" should "convert relative path's to docker-bind path's" in {
    val relative = "a/b/c/test.mo"
    mapper.toBindPath(Paths.get(relative)) shouldBe bindRoot.resolve(relative)
  }
  it should "convert absolute path's to docker-bind path's" in {
    val relative = "a/b/c/test.mo"
    val absolute = hostRoot.resolve(relative)
    mapper.toBindPath(absolute) shouldBe bindRoot.resolve(relative)
  }
  it should "convert path's with spaces to docker-bind path's" in {
    val relative = "a/b/c x d/test.mo"
    val absolute = hostRoot.resolve(relative)
    mapper.toBindPath(absolute) shouldBe bindRoot.resolve(relative)
  }
  it should "convert docker-bind path's to host path's" in {
    val relative = "a/b/c/test.mo"
    mapper.toHostPath(bindRoot.resolve(relative)) shouldBe hostRoot.resolve(relative)
  }
  it should "rouned-trippin' when converting host => bind => host" in {
    val absolute = hostRoot.resolve("a/b/c/test.mo")
    val fn: Path => Path = mapper.toBindPath _ andThen mapper.toHostPath _
    fn(absolute) shouldBe absolute
  }
  it should "relativize bind-path's" in {
    val relative = "a/b/c/test.mo"
    val absolute = bindRoot.resolve(relative)
    mapper.relativize(absolute) shouldBe Paths.get(relative)
  }
}
