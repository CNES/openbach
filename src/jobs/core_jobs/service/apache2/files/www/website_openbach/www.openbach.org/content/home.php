<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="">

    <title>OpenBACH</title>

    <!-- Bootstrap Core CSS -->
    <link href="../css/bootstrap.min.css" rel="stylesheet">

    <!-- Custom CSS -->
    <link href="../css/openbach.css" rel="stylesheet">
	<link href="../css/scrolling-nav.css" rel="stylesheet">
	<link rel="icon" type="image/png" href="../img/tab_logo.png" />
    <!-- Custom Fonts -->
    <link href="../font-awesome/css/font-awesome.min.css" rel="stylesheet" type="text/css">

    <!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
        <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
        <script src="https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js"></script>
    <![endif]-->

</head>
<script src="../../ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>


<body>

    <!-- Navigation -->
    
 <nav class="navbar navbar-inverse navbar-fixed-top navbar-custom" role="navigation">
        <div class="container">
            <!-- Brand and toggle get grouped for better mobile display -->
            <div class="navbar-header">
                <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
                    <span class="sr-only">Toggle navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
               <!-- <a class="navbar-brand page-scroll" href="index.html"> <img id="logo" src="img/logo2.png" alt=""/></a>-->
				<div id = "imgLogo">
					<img class="logo" src="../img/logo2.png" onclick="document.location.href = 'home.php'" alt=""></img>
				</div>
            </div>
            <!-- Collect the nav links, forms, and other content for toggling -->
            <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                <ul class="nav navbar-nav navbar-right">
                    <li class="dropdown page-scroll">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown"> <p class = "text-custom" > About <b class="caret"></b> </p> </a>
                        <ul class="dropdown-menu">
							<li>
								<a href="overview.php" style="font-size:100%">Overview</a>
							</li>
							<li>
								<a href="references.php" style="font-size:100%">References</a>
							</li>
						
                            <li>
                                <a href="commitee.php" style="font-size:100%">Steering commitee</a>
                            </li>
                        </ul>
                    </li>
					<li class="dropdown page-scroll">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown"> <p class = "text-custom" > Get & Learn <b class="caret"></b> </p></a>
                        <ul class="dropdown-menu">
                            <li>
                                <a href="get.php" style="font-size:100%">Installation</a>
                            </li>
				<li>
                                <a href="mail.php" style="font-size:100%">Mailing-lists</a>
                            </li>
                            <li>
                                <a href="https://github.com/CNES/openbach/blob/master/README.md" style="font-size:100%">Wiki</a>
                            </li>
				<li>
                                <a href="jobs.php" style="font-size:100%">Related tools & Jobs</a>
                            </li>
                        </ul>
                    </li>
					<li class="dropdown page-scroll">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown"> <p class = "text-custom" > Contribute  <b class="caret"></b> </p> </a>
                        <ul class="dropdown-menu">
							<li>
                                <a href="contribution.php" style="font-size:100%">Contribution</a>
                            </li>
                            <li>
                                <a href="bugtracker.php" style="font-size:100%">Bugtracker</a>
                            </li>
                            <li>
                                <a href="https://github.com/CNES/openbach" style="font-size:100%">Forge OpenBACH</a>
                            </li>
                        </ul>
                    </li>
					<li class = "page-scroll">
                        <a href="blog.php" ><p class = "text-custom" >Blog </p></a>
                    </li>

					<li class = "page-scroll">
                        <a href="https://github.com/CNES/openbach"> <img src="../img/gitlab-logo-square.png"/> </a>
                    </li>
                </ul>
            </div>
            <!-- /.navbar-collapse -->
        </div>
        <!-- /.container -->
    </nav>

    <!-- Header Carousel -->
    <header id="myCarousel" class="carousel slide">
      
        <!--ol class="carousel-indicators">
           <li data-target="#myCarousel" data-slide-to="0" class="active"></li>
        </ol-->

        
        <div class="carousel-inner">
            <div class="item active">
               <div class="fill" style="background-image:url('../img/banner1.jpeg');"></div>
                <div class="carousel-caption">
                </div>
            </div>
        </div>

        
        <a class="left carousel-control" href="#myCarousel" data-slide="prev">
            <span class="icon-prev"></span>
        </a>
        <a class="right carousel-control" href="#myCarousel" data-slide="next">
            <span class="icon-next"></span>
        </a>
    </header>
    <!-- Page Content -->
	
	<section class="font-blue">
		<div class="container" >
			<!-- Marketing Icons Section -->
			<div class="row">
				<div class="col-lg-12">
					<center>
						<h2 style="text-align:center;">OpenBACH provides a modular benchmark allowing for fast integration of metrology tools over different types of networks and equipments. </h2>
					</center>
				</div>
			</div>
		</div>
	</section>
	
	<section>
		<div class="container" >
			<!-- Marketing Icons Section -->
			<div class="row">
				<div class="col-lg-6">
					<center>
						<img style="max-width: 100%; max-heigh: 100%" src="../img/benchmark_scheme.png"/>
					</center>
				</div>
				<div class="col-lg-6">
					<center>
						<h2>Metrology use case</h2>
						<br>
						<p> OpenBACH fulfills a typical benchmark use case by means of:</p>
						<ul>
							<li>Easy and straightforward installation/deployment</li>
							<li>Configuring Jobs/entities and schedule scenarios</li>
							<li>Supervising the benchmark and collecting measures</li>
							<li>Performing post-processing tasks</li>

						</ul>

					</center>
					<br>
				</div>
			</div>
		</div>
	</section>
	
	<section class= "font-yellow">
		<div class="container" >
			<!-- Marketing Icons Section -->
			<div class="row">
				<div class="col-lg-12">
					<center>
						<h2>Configuration & Supervision</h2>
						<br>
						<p style="text-align:center;">Provides centralized configuration of the benchmark Agents.</p>
						<p style="text-align:center;">Supervises the Agents and the Jobs status.</p>
					</center>
				</div>
			</div>
			<div class="row">
				<div class="col-lg-6">
					<center>
					<br>
						<img style="max-width: 100%;" src="../img/openbach_admin_page.png"/>
					</center>
				</div>
				<div class="col-lg-6">
					<center>
					<br>
						<img style="max-width: 100%; " src="../img/openbach_list_installed_jobs.png"/>
					</center>
				</div>
			</div>
			<br>
			<div class="row">
				<div class="col-lg-3"></div>
				<div class="col-lg-6">
					<center>
						<img style="max-width: 100%; max-height: 100%" src="../img/status_screen.png"/>
					</center>
				</div>
				<div class="col-lg-3"></div>
			</div>
		</div>
	</section>
		
	<section class="font-blue">
		<div class="container" >
			<!-- Marketing Icons Section -->
			<div class="row">
				<div class="col-lg-6">
					<center>
						<h2>Monitoring</h2>
						<br>
						<p>Collection and display of statistics/measures and log messages</p>
					</center>
				</div>
				<div class="col-lg-6">
					<center>
						<img style="max-width: 100%; max-heigh: 100%" src="../img/dashboard_ex.png"/>
					</center>
				</div>
			</div>
		</div>
	</section>

	
	<br>
	

        <!-- Footer -->
		<footer>
	<div class="container">
            <div class="row">
                <div class="col-lg-12">
					<div id="licenses">
						<p style="font-size:90%">Contact <a href="mailto:admin _AT_ openbach _DOT_ org" title="OpenBACH contact">
						   OpenBACH Steering Committee <i class="fa fa-envelope" aria-hidden="true"></i></a></p>
						<p style="font-size:90%">The text content of this website is published under the <a 
						   href="http://creativecommons.org/licenses/by-nc-sa/3.0/" title="See license details"
						   rel="license" hreflang="en">Creative Commons BY-NC-SA license</a> (except where otherwise
						   stated). Some sections icons are derivative work of the GPL2 icons provided by the Gnome
						   project.</p>
						<p style="font-size:90%">Logos and trademarks are the property of their respective owners. Any representation,
						   reproduction and/or exploitation, whether partial or total, of trademarks and logos
						   is prohibited without prior written permission from the owners.</p>
						<p style="font-size:90%"><a href="./privacy_policy.php" title="Read the privacy policy">
						   Privacy policy</a>.</p>
					</div>
                </div>
            </div>
	</div>
</footer>
    </div>
   

</body>
 <!-- /.container -->

    <!-- jQuery -->
    <script src="../js/jquery.js"></script>

    <!-- Bootstrap Core JavaScript -->
    <script src="../js/bootstrap.min.js"></script>

    <!-- Script to Activate the Carousel -->
    <script>
    $('.carousel').carousel({
        interval: 5000 //changes the speed
    })
    </script>
	
	<!-- Scrolling Nav JavaScript -->
    <script src="../js/jquery.easing.min.js"></script>
    <script src="../js/scrolling-nav.js"></script>

</html>
