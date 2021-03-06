<?php
/*
	METHOD: POST

	:idhash = id hashé de l'image à supprimer/restaurer
	:value = | 1 pour supprimer
			 | 0 pour restaurer

*/


include ("includes/identifiants.php");
include_once ('includes/token.class.php');
include_once ("includes/constants.php");
include_once 'check_grade.php';

if (!isset($_SESSION)) {
    session_start ();
}
/*
$referer = parse_url($_SERVER['HTTP_REFERER'], PHP_URL_HOST);
$domaine= parse_url(SITE_DOMAINE, PHP_URL_HOST);
if ($referer != $domaine) {
	header("HTTP/1.0 403 Forbidden");
	exit();
} */

$id_user = $_SESSION['id'];
if (!$id_user) {
	header('HTTP/1.0 403 Forbidden');
    exit();
};

if(!isset($_POST['value'])) {
	header('HTTP/1.0 400 Bad Request');
	exit();
}
/* A REMETTRE : BUG GRANDES CARTES
if((Token::verifier(600, 'A')) == false) {
	echo 'Erreur Token';
	exit();
}
*/
$val = $_POST['value'];

if($val != 0 && $val != 1) {
	header('HTTP/1.0 400 Bad Request');
	exit();
}

$req = $bdd->prepare ('SELECT id_user FROM images WHERE nom_hash = :idhash ');
$req->execute ([
    ':idhash' => $_POST['idhash'],
]);
$resultat = $req->fetch ();

if (!$resultat) {
	header('HTTP/1.0 400 Bad Request');
    exit();
}

$id_poster = $resultat['id_user'];


if ($grade < 5 && $id_user != $id_poster) {
    //pas assez gradé ou pas poster original
	header('HTTP/1.0 403 Forbidden');
    exit();
}

$req = $bdd->prepare ('UPDATE images SET supprime = :sup WHERE nom_hash = :idhash');
$req->execute ([
	':idhash' => $_POST['idhash'],
	':sup' => $val
]);


file_put_contents('/var/www/html/log', $_SESSION['pseudo'].' a supprime ('.$val.') l image '.$_POST['idhash']."\n",FILE_APPEND);
