
var currentCardShare;
var gridLayout = $('.card-container');

$(document).ready(function() {


	//au chargement: affiche 30 cartes
	//layout
	gridLayout.masonry({
		itemSelector: '.card',
		columnWidth: 370,
		fitWidth: true,
		stagger: 30
	});

	


	getCards(30);

});


$(window).scroll(function() {
	//quand l'user atteind le bas de la page, rajoute 20 cartes
	if($(window).scrollTop() + $(window).height() >= $(document).height() - 200) {
		getCards(20);
	}
});


//nb de cartes affichées
var currentIndex = 0;

//récupère les $size prochaines cartes depuis le serveur et les affiche
function getCards(size) {
	var sort = $("#sort").val();

	$.ajax({
		url: "MODELS/requestajax.php",
		type: "POST",
		data: {
			'size': parseInt(size),
			'sort': sort,
			'startIndex': parseInt(currentIndex)
		},
		success: function(data) {
			console.log(data);
			data = JSON.parse(data);
			var i = 0;
			for(x = 0; x < data.length; ++x) {
				console.log(data[x]);
				addCard(data[x]);
				i++;
			}
			currentIndex += i;
		}
	})
}


//ajoute une carte à la page
function addCard(c) {
	var idhash= c.idhash;
	var id = c.id;
	var titre = c.titre;
	var dateCreation = c.dateCreation;
	var pseudoUser = c.pseudoUser;
	var idUser = c.idUser;
	var points = c.pointsTotaux;
	var url = c.urlThumbnail;
	
	//string du temps passé depuis le post
	var temps = getTimeElapsed(dateCreation);
	
	//récupère le template
	var card = $('.template').clone();
	card.attr('id', id);
	card.find('.card-img>img').attr('src', url);
	card.find('.card-title').html(titre);
	card.find('.card-author>a').attr('src', 'user.php?id=' + idUser)
							   .html(pseudoUser);
	card.find('.card-link').attr('data-clipboard-text', urlBase + 'view.php?id=' + idhash);

	
	//vérifie l'ancien vote de l'user
	$.post(
		'MODELS/check_vote.php',
		{
			id_image: id
		},
		returnVote,
		'text'
	);

	//ajoute la classe 'voted' à l'ancien vote
	function returnVote(ancien) {
		ancien = parseInt(ancien);
		if(ancien == 1)
			card.find(".card-thumb-up").addClass("voted");
		else if(ancien == -1)
			card.find(".card-thumb-down").addClass("voted");	
	}

	//assigne les fonctions de vote aux boutons
	card.find(".card-facebook").click(shareFacebook);
	card.find(".card-twitter").click(shareTwitter);
	//card.find(".card-gplus").click(shareGplus);


	//bouton SHARE
	$(".card-share-plus").click(function(e) {
		animateShare($(e.target).closest(".card"));
	});
	
	//ferme les share si on clique ailleurs
	$(".container").click(function() {
		if(currentCardShare != null)
			animateShare(currentCardShare);
	});


	//bouton THUMBUP
	$(".card-thumb-up").click(function() {
		if(!$(this).hasClass("voted")) {
			$(this).addClass("voted");
			$(this).siblings(".card-thumb-down").removeClass("voted");
			var card = $(this).closest(".card");
			card.css('background', '#23b9d0');
			card.stop(true, false).animate({backgroundColor: '#ffffff'}, 700);

			vote(card.attr('id'), 1);

		}
	});

	//bouton THUMBDOWN
	$(".card-thumb-down").click(function() {
		if(!$(this).hasClass("voted")) {
			$(this).addClass("voted");
			$(this).siblings(".card-thumb-up").removeClass("voted");
			var card = $(this).closest(".card");
			card.css('background', '#e23d22');
			card.stop(true, false).animate({backgroundColor: '#ffffff'}, 700);
			
			vote(card.attr('id'), -1);
		}
	});
	
	//bouton OPEN
	$(".card-open").click(function() {
		var card = $(this).closest(".card");
		var width = 1000;
		var height = 1000;
		
		var marginLeft = $(this).closest(".card").parent().width() - width;
		marginLeft /= 2;
		card.css({'position': 'absolute', 'z-index': '3'});
		$('.overlay').addClass("overlay_active");
		card.animate({width: width+'px', height: height+'px', left: marginLeft+'px'}, 400, 'easeInOutQuad');


	});

	//HOVER THUMBUP
	$(".card-thumb-up").hover(function() {
		$(this).closest(".card").css({
					"-webkit-box-shadow": "0 0 15px 5px #23b9d0",
					"-moz-box-shadow": "0 0 15px 5px #23b9d0",
					"box-shadow": "0 0 15px 5px #23b9d0"
					});
		},
		function() {
		$(this).closest(".card").css({
					"-webkit-box-shadow": "0 0 8px 5px #ccc",
					"-moz-box-shadow": "0 0 8px 5px #ccc",
					"box-shadow": "0 0 8px 5px #ccc"
					});

	});


	//HOVER THUMBDOWN
	$(".card-thumb-down").hover(function() {
			$(this).closest(".card").css({
						"-webkit-box-shadow": "0 0 15px 5px #e23d22",
						"-moz-box-shadow": "0 0 15px 5px #e23d22",
						"box-shadow": "0 0 15px 5px #e23d22"
						});
		},
		function() {
			$(this).closest(".card").css({
						"-webkit-box-shadow": "0 0 8px 5px #ccc",
						"-moz-box-shadow": "0 0 8px 5px #ccc",
						"box-shadow": "0 0 8px 5px #ccc"
						});
	
	});
	
	

	$('.card-container').append(card);
	card.removeClass('template');
	card.addClass('card');
	card.show();

	$(card).imagesLoaded().progress(function() {
		$(gridLayout).masonry('reloadItems');
		$(gridLayout).masonry('layout');
	});

	$(gridLayout).masonry('reloadItems');
	$(gridLayout).masonry('layout');

	//initialise le clipboard lié au bouton copier
	var cb = new Clipboard(card.find(".card-link").get(0));
	cb.on('success', function() {
		//change le titre du tooltip quand on a copié
		card.find('.card-link').attr('title', 'Lien copié !').tooltip('fixTitle').tooltip('show');
	});

	//remet le titre original au hoverOut
	card.find('.card-link').on('mouseout', function() {
		$(this).attr('title', 'Copier le lien').tooltip('fixTitle');
	});

	//initialise les tooltips des boutons de partage
	card.find('[data-toggle="tooltip"]').tooltip();

}









//ouvre/ferme le menu share de la carte
function animateShare(card) {
	var btn = card.find(".card-share-plus");

	if(btn.hasClass("animating")) //déjà en animation
		return;

	var card = btn.closest(".card");
	
	btn.tooltip("hide");
	btn.addClass("animating");

	if(!btn.hasClass("on")) { //si il n'est pas ouvert, on ouvre

		btn.addClass("on");

		if(currentCardShare != null) //si un autre share menu est ouvret, on le ferme
			animateShare(currentCardShare);
		currentCardShare = card;

		var anim = false;
		card.find(".card-link, .card-open, .card-votes").hide("fade", 150, function() {
			if(!anim) {
				anim = true;
				btn.animate({left: '10px', color: '#e23d22'}, 250, 'easeInOutQuad',
				function() { btn.removeClass("animating"); });
				card.find(".card-share-buttons").show("fade", 200);
			}
		});
		
		btn.css({
		
		"-moz-animation-name": "rotateglyph",
		"-moz-animation-duration": "0.15s",
		"-moz-animation-iteration-count": "1",
		"-moz-animation-fill-mode": "forwards",
	
		"-webkit-animation-name": "rotateglyph",
		"-webkit-animation-duration": "0.15s",
		"-webkit-animation-iteration-count": "1",
		"-webkit-animation-fill-mode": "forwards"
	
		}).attr("title", "Retour").tooltip("fixTitle");
	} else { // on ferme

		currentCardShare = null;
		btn.removeClass("on")
		btn.css({
		"-moz-animation-name": "rotateglyph2",
		"-moz-animation-duration": "0.15s",
		"-moz-animation-iteration-count": "1",
		"-moz-animation-fill-mode": "forwards",
	
		"-webkit-animation-name": "rotateglyph2",
		"-webkit-animation-duration": "0.15s",
		"-webkit-animation-iteration-count": "1",
		"-webkit-animation-fill-mode": "forwards",
	
		}).attr("title", "Partager").tooltip("fixTitle")
		.delay(150).animate({left: "160px", color: "black"}, 250, 'easeInOutQuad', 
			function() {
				btn.removeClass("animating");
			});
		card.find(".card-link, .card-open, .card-votes").delay(200).show("fade", 150);
		card.find(".card-share-buttons").hide("fade", 200);
	}
}

//ferme les share si on clique ailleurs
$(".card-container").click(function() {
	if(currentCardShare != null)
		animateShare(currentCardShare);
});