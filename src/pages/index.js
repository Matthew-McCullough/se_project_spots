import "./index.css";
import Api from "../utils/Api.js";
import logoImage from "../images/logo.svg";
import pencilImage from "../images/pencil.svg";
import plusImage from "../images/plus.svg";
import {
  enableValidation,
  validationConfig,
  resetValidation,
  disableButton,
} from "../scripts/validation.js";

const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "73d37e56-85c9-4875-89a5-2f037dfe7401",
    "Content-Type": "application/json",
  },
});

const editProfileButton = document.querySelector(".profile__edit-btn");
const addProfileButton = document.querySelector(".profile__add-btn");
const profileName = document.querySelector(".profile__name");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__avatar");

const headerLogo = document.querySelector(".header__logo");
const editProfileIcon = editProfileButton.querySelector("img");
const addProfileIcon = addProfileButton.querySelector("img");

headerLogo.src = logoImage;
editProfileIcon.src = pencilImage;
addProfileIcon.src = plusImage;

const editModal = document.querySelector("#edit-modal");
const editFormElement = editModal.querySelector(".modal__form");
const editModalCloseButton = editModal.querySelector(".modal__close-btn");
const editModalNameInput = editModal.querySelector("#profile-name-input");
const editModalDescriptionInput = editModal.querySelector(
  "#profile-description-input",
);
const previewModal = document.querySelector("#preview-modal");
const previewModalImageEl = previewModal.querySelector(".modal__image");
const previewModalCaption = previewModal.querySelector(".modal__caption");
const cardModal = document.querySelector("#add-card-modal");
const cardForm = cardModal.querySelector(".modal__form");
const cardSubmitButton = cardModal.querySelector(".modal__submit-btn");
const cardModalCloseButton = cardModal.querySelector(".modal__close-btn");
const cardNameInput = cardModal.querySelector("#add-card-name-input");
const cardLinkInput = cardModal.querySelector("#add-card-link-input");
const previewModalCloseButton = previewModal.querySelector(".modal__close-btn");

const cardTemplate = document.querySelector("#card-template");
const cardsList = document.querySelector(".cards__list");

function getCardElement(data, userId) {
  const cardElement = cardTemplate.content
    .querySelector(".card")
    .cloneNode(true);

  const cardNameEl = cardElement.querySelector(".card__title");
  const cardImageEl = cardElement.querySelector(".card__image");
  const cardLikeButton = cardElement.querySelector(".card__like-btn");
  const cardDeleteButton = cardElement.querySelector(".card__delete-btn");

  const isOwnCard = data.owner === userId;

  if (!isOwnCard) {
    cardDeleteButton.style.display = "none";
  }

  cardNameEl.textContent = data.name;
  cardImageEl.src = data.link;
  cardImageEl.alt = data.name;

  if (data.isLiked) {
    cardLikeButton.classList.add("card__like-btn_liked");
  }

  cardLikeButton.addEventListener("click", () => {
    const isLiked = cardLikeButton.classList.contains("card__like-btn_liked");

    const likeRequest = isLiked
      ? api.unlikeCard(data._id)
      : api.likeCard(data._id);

    likeRequest
      .then(() => {
        cardLikeButton.classList.toggle("card__like-btn_liked");
      })
      .catch((err) => {
        console.error("Failed to update like:", err);
      });
  });

  cardDeleteButton.addEventListener("click", () => {
    api
      .removeCard(data._id)
      .then(() => {
        cardElement.remove();
      })
      .catch((err) => {
        console.error("Failed to delete card:", err);
      });
  });

  cardImageEl.addEventListener("click", () => {
    openModal(previewModal);
    previewModalCaption.textContent = data.name;
    previewModalImageEl.src = data.link;
    previewModalImageEl.alt = data.name;
  });

  return cardElement;
}

function openModal(modal) {
  modal.classList.add("modal_opened");
  document.addEventListener("keydown", handleEscClose);
  modal.addEventListener("mousedown", handleOverlayClose);
}

function closeModal(modal) {
  modal.classList.remove("modal_opened");
  document.removeEventListener("keydown", handleEscClose);
  modal.removeEventListener("mousedown", handleOverlayClose);
}

function handleEscClose(evt) {
  if (evt.key === "Escape") {
    // Find the open modal and close it
    const openedModal = document.querySelector(".modal_opened");
    if (openedModal) {
      closeModal(openedModal);
    }
  }
}

function handleOverlayClose(evt) {
  if (evt.target === evt.currentTarget) {
    closeModal(evt.target);
  }
}

function handleEditFormSubmit(evt) {
  evt.preventDefault();

  const submitButton =
    evt.submitter || editFormElement.querySelector(".modal__submit-btn");
  const originalButtonText = submitButton.textContent;

  submitButton.textContent = "Saving...";

  api
    .editUserInfo({
      name: editModalNameInput.value,
      about: editModalDescriptionInput.value,
    })
    .then((userData) => {
      profileName.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModal(editModal);
    })
    .catch((err) => {
      console.error("Failed to update profile:", err);
    })
    .finally(() => {
      submitButton.textContent = originalButtonText;
    });
}

function handleAddCardSubmit(evt) {
  evt.preventDefault();

  const submitButton =
    evt.submitter || cardForm.querySelector(".modal__submit-btn");
  const originalButtonText = submitButton.textContent;

  submitButton.textContent = "Saving...";

  api
    .addCard({
      name: cardNameInput.value,
      link: cardLinkInput.value,
    })
    .then((cardData) => {
      const cardElement = getCardElement(cardData, currentUserId);
      cardsList.prepend(cardElement);

      cardForm.reset();
      disableButton(cardSubmitButton, validationConfig);
      closeModal(cardModal);
    })
    .catch((err) => {
      console.error("Failed to add card:", err);
    })
    .finally(() => {
      submitButton.textContent = originalButtonText;
    });
}

editProfileButton.addEventListener("click", () => {
  editModalNameInput.value = profileName.textContent;
  editModalDescriptionInput.value = profileDescription.textContent;
  resetValidation(
    editFormElement,
    [editModalNameInput, editModalDescriptionInput],
    validationConfig,
  );
  openModal(editModal);
});

editModalCloseButton.addEventListener("click", () => {
  closeModal(editModal);
});

addProfileButton.addEventListener("click", () => {
  openModal(cardModal);
});

cardModalCloseButton.addEventListener("click", () => {
  closeModal(cardModal);
});

previewModalCloseButton.addEventListener("click", () => {
  closeModal(previewModal);
});

editFormElement.addEventListener("submit", handleEditFormSubmit);
cardForm.addEventListener("submit", handleAddCardSubmit);

let currentUserId;

Promise.all([api.getUserInfo(), api.getInitialCards()])
  .then(([userData, cards]) => {
    currentUserId = userData._id;

    profileName.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.src = userData.avatar;
    profileAvatar.alt = userData.name;

    cards.forEach((cardData) => {
      const cardElement = getCardElement(cardData, currentUserId);
      cardsList.append(cardElement);
    });
  })
  .catch((err) => {
    console.error("Failed to load initial data:", err);
  });

enableValidation(validationConfig);
